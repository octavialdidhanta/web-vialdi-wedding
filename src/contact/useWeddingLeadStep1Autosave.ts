import { useCallback, useEffect, useState } from "react";
import { saveLeadIdentity } from "@/contact/leadIdentityStorage";
import { isValidEmail, isValidPhone } from "@/contact/leadValidators";

type Args = {
  packageId?: string;
  packageLabel: string;
  name: string;
  phone: string;
  email: string;
  step: 1 | 2 | 3;
  locked?: boolean;
};

/**
 * Step 1 — local validation + identity cache only (no server draft).
 * Synckerja receives the full lead on step 2 submit.
 */
export function useWeddingLeadStep1Autosave(args: Args) {
  const [step1Ready, setStep1Ready] = useState(false);

  const enabled = args.step === 1 && !args.locked;
  const fieldsOk =
    args.name.trim().length > 0 && isValidPhone(args.phone) && isValidEmail(args.email);

  const resetStep1Lead = useCallback((_forceClear?: boolean) => {
    setStep1Ready(false);
  }, []);

  const ensureStep1RowId = useCallback(async (): Promise<string> => {
    if (args.step !== 1) {
      throw new Error("ensureStep1RowId hanya untuk langkah 1.");
    }
    if (!fieldsOk) {
      throw new Error("Lengkapi nama, telepon, dan email yang valid.");
    }
    saveLeadIdentity({
      name: args.name.trim(),
      phone: args.phone.trim(),
      email: args.email.trim(),
    });
    setStep1Ready(true);
    return "local-step1";
  }, [args.step, args.name, args.phone, args.email, fieldsOk]);

  useEffect(() => {
    if (!enabled) return;
    setStep1Ready(fieldsOk);
  }, [enabled, fieldsOk]);

  return { leadRowId: step1Ready ? "local-step1" : null, resetStep1Lead, ensureStep1RowId };
}
