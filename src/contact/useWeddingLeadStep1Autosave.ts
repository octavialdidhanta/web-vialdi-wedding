import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getOrCreateSessionId,
  getRequiredWebId,
  readLandingAttributionForLead,
} from "@/analytics/sendAnalyticsBatch";
import { saveLeadIdentity } from "@/contact/leadIdentityStorage";
import { isValidEmail, isValidPhone } from "@/contact/leadValidators";
import { submitWeddingPackageLead } from "@/contact/weddingPackageLeadApi";
import { readPersistedWeddingPackageLeadRowId, writePersistedWeddingPackageLeadRowId } from "@/contact/weddingPackageLeadSession";

const DEBOUNCE_MS = 1000;

function readPersistedLeadRowIdSafe(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return readPersistedWeddingPackageLeadRowId(getRequiredWebId());
  } catch {
    return null;
  }
}

type Args = {
  packageLabel: string;
  name: string;
  phone: string;
  email: string;
  /** Hanya jalankan autosave saat langkah 1 aktif. */
  step: 1 | 2 | 3;
  /** Jika lead baru saja terkirim, hentikan autosave (TTL / dedupe). */
  locked?: boolean;
};

/**
 * Step 1 ke Edge Function (debounced). Satu `leads_vialdi_wedding.id` per tab disimpan di
 * sessionStorage; ganti kartu paket → UPDATE baris yang sama (termasuk `package_label`), bukan INSERT baru.
 */
export function useWeddingLeadStep1Autosave(args: Args) {
  const [leadRowId, setLeadRowId] = useState<string | null>(() => readPersistedLeadRowIdSafe());
  const leadRowIdRef = useRef<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const resetStep1Lead = useCallback((forceClear?: boolean) => {
    latestRequestIdRef.current += 1;
    if (forceClear) {
      leadRowIdRef.current = null;
      setLeadRowId(null);
      return;
    }
    try {
      const webId = getRequiredWebId();
      const persisted = readPersistedWeddingPackageLeadRowId(webId);
      leadRowIdRef.current = persisted;
      setLeadRowId(persisted);
    } catch {
      leadRowIdRef.current = null;
      setLeadRowId(null);
    }
  }, []);

  useLayoutEffect(() => {
    leadRowIdRef.current = leadRowId;
  }, [leadRowId]);

  const enabled = args.step === 1 && !args.locked;
  const fieldsOk =
    args.name.trim().length > 0 && isValidPhone(args.phone) && isValidEmail(args.email);

  /**
   * Simpan langkah 1 segera (mis. sebelum "Lanjut" jika autosave belum sempat sukses).
   * Membatalkan hasil debounce yang tertinggal agar tidak menimpa state.
   */
  const ensureStep1RowId = useCallback(async (): Promise<string> => {
    if (args.step !== 1) {
      throw new Error("ensureStep1RowId hanya untuk langkah 1.");
    }
    if (!fieldsOk) {
      throw new Error("Lengkapi nama, telepon, dan email yang valid.");
    }
    latestRequestIdRef.current += 1;
    const flushToken = latestRequestIdRef.current;

    const currentId = leadRowIdRef.current;
    const res = await submitWeddingPackageLead({
      step: 1,
      name: args.name.trim(),
      phone_number: args.phone.trim(),
      email: args.email.trim(),
      package_label: args.packageLabel,
      attribution: readLandingAttributionForLead(),
      analytics_session_id: getOrCreateSessionId(),
      web_id: getRequiredWebId(),
      ...(currentId ? { id: currentId } : {}),
    });

    if (flushToken !== latestRequestIdRef.current) {
      throw new Error("Permintaan dibatalkan. Coba lagi.");
    }
    leadRowIdRef.current = res.id;
    setLeadRowId(res.id);
    try {
      const webId = getRequiredWebId();
      writePersistedWeddingPackageLeadRowId(webId, res.id);
    } catch {
      /* VITE_WEB_ID missing — tetap lanjutkan alur form */
    }
    saveLeadIdentity({
      name: args.name.trim(),
      phone: args.phone.trim(),
      email: args.email.trim(),
    });
    return res.id;
  }, [args.step, args.name, args.phone, args.email, args.packageLabel, fieldsOk]);

  /** Saat kembali ke langkah 1 tanpa unmount, pastikan ref mengikuti session (mis. setelah submit di tab lain). */
  useEffect(() => {
    if (!enabled) return;
    try {
      const webId = getRequiredWebId();
      const persisted = readPersistedWeddingPackageLeadRowId(webId);
      if (!persisted) return;
      setLeadRowId((prev) => {
        if (prev === persisted) return prev;
        leadRowIdRef.current = persisted;
        return persisted;
      });
    } catch {
      /* no web id */
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !fieldsOk) return;
    let webId: ReturnType<typeof getRequiredWebId>;
    try {
      webId = getRequiredWebId();
    } catch {
      return;
    }

    const requestId = ++latestRequestIdRef.current;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const currentId = leadRowIdRef.current;
          const res = await submitWeddingPackageLead({
            step: 1,
            name: args.name.trim(),
            phone_number: args.phone.trim(),
            email: args.email.trim(),
            package_label: args.packageLabel,
            attribution: readLandingAttributionForLead(),
            analytics_session_id: getOrCreateSessionId(),
            web_id: getRequiredWebId(),
            ...(currentId ? { id: currentId } : {}),
          });
          if (requestId !== latestRequestIdRef.current) return;
          leadRowIdRef.current = res.id;
          setLeadRowId(res.id);
          writePersistedWeddingPackageLeadRowId(webId, res.id);
          saveLeadIdentity({
            name: args.name.trim(),
            phone: args.phone.trim(),
            email: args.email.trim(),
          });
        } catch (e: unknown) {
          if (requestId !== latestRequestIdRef.current) return;
          if (import.meta.env.DEV) {
            console.warn("[wedding-package-lead] step 1 autosave gagal:", e);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
      latestRequestIdRef.current += 1;
    };
  }, [enabled, fieldsOk, args.name, args.phone, args.email, args.packageLabel]);

  return { leadRowId, resetStep1Lead, ensureStep1RowId };
}
