import { useCallback, useEffect, useRef, useState } from "react";
import { readLandingAttributionForLead } from "@/analytics/sendAnalyticsBatch";
import { saveLeadIdentity } from "@/contact/leadIdentityStorage";
import { isValidEmail, isValidPhone } from "@/contact/leadValidators";
import { submitWeddingPackageLead } from "@/contact/weddingPackageLeadApi";

const DEBOUNCE_MS = 1000;

type Args = {
  packageLabel: string;
  name: string;
  phone: string;
  email: string;
  /** Hanya jalankan autosave saat langkah 1 aktif. */
  step: 1 | 2;
};

/**
 * Step 1 ke Edge Function secara debounced; tanpa indikator UI (hanya `leadRowId` untuk alur form).
 */
export function useWeddingLeadStep1Autosave(args: Args) {
  const [leadRowId, setLeadRowId] = useState<string | null>(null);
  const leadRowIdRef = useRef<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const resetStep1Lead = useCallback(() => {
    latestRequestIdRef.current += 1;
    leadRowIdRef.current = null;
    setLeadRowId(null);
  }, []);

  useEffect(() => {
    leadRowIdRef.current = leadRowId;
  }, [leadRowId]);

  const enabled = args.step === 1;
  const fieldsOk =
    args.name.trim().length > 0 && isValidPhone(args.phone) && isValidEmail(args.email);

  useEffect(() => {
    if (!enabled || !fieldsOk) return;

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
            ...(currentId ? { id: currentId } : {}),
          });
          if (requestId !== latestRequestIdRef.current) return;
          leadRowIdRef.current = res.id;
          setLeadRowId(res.id);
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

  return { leadRowId, resetStep1Lead };
}
