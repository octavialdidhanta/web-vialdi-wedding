/** Shared validators for contact & wedding package lead forms. */

/** Kode negara yang tersedia di input telepon (urut panjang desc untuk parsing). */
export const PHONE_COUNTRY_DIALS = ["+62", "+65", "+1"] as const;
export type PhoneCountryDial = (typeof PHONE_COUNTRY_DIALS)[number];

export const DEFAULT_PHONE_DIAL: PhoneCountryDial = "+62";

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/** Bagian nasional: hanya digit; untuk +62 hilangkan 0 di depan dan prefiks 62 jika dobel. */
export function sanitizeNationalForDial(dial: string, raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (dial === "+62") {
    while (d.startsWith("0")) d = d.slice(1);
    if (d.startsWith("62")) d = d.slice(2);
  } else {
    while (d.startsWith("0")) d = d.slice(1);
  }
  return d;
}

export function normalizePhone(v: string) {
  const trimmed = v.trim();
  const compact = trimmed.replace(/[\s().-]/g, "");

  if (compact.startsWith("+")) {
    const digits = compact.slice(1).replace(/[^\d]/g, "");
    return `+${digits}`;
  }

  const digitsOnly = compact.replace(/[^\d]/g, "");
  if (/^(0?8\d{8,13})$/.test(digitsOnly)) {
    const national = digitsOnly.startsWith("0") ? digitsOnly.slice(1) : digitsOnly;
    return `+62${national}`;
  }

  const digits = compact.replace(/[^\d]/g, "");
  return digits.length ? `+${digits}` : "";
}

/** Pecah nilai tersimpan menjadi dial + nasional untuk UI kode negara + field digit. */
export function parsePhoneForCountryFields(phone: string): { dial: PhoneCountryDial; national: string } {
  const empty = { dial: DEFAULT_PHONE_DIAL, national: "" };
  const p = phone.trim();
  if (!p) return empty;

  const normalized = normalizePhone(p);
  const candidate = normalized.startsWith("+") ? normalized : p.replace(/[\s().-]/g, "");

  const sorted = [...PHONE_COUNTRY_DIALS].sort((a, b) => b.length - a.length) as PhoneCountryDial[];
  for (const dial of sorted) {
    if (candidate.startsWith(dial)) {
      const rawNat = candidate.slice(dial.length).replace(/[^\d]/g, "");
      return { dial, national: sanitizeNationalForDial(dial, rawNat) };
    }
  }

  if (!p.startsWith("+")) {
    const digits = p.replace(/\D/g, "");
    return { dial: DEFAULT_PHONE_DIAL, national: sanitizeNationalForDial(DEFAULT_PHONE_DIAL, digits) };
  }

  return empty;
}

/** Gabung dial + nasional menjadi string untuk state/API (tanpa spasi). */
export function composeInternationalPhone(dial: string, nationalDigits: string): string {
  const nat = sanitizeNationalForDial(dial, nationalDigits);
  if (!nat) return "";
  return `${dial}${nat}`;
}

export function isValidPhone(v: string) {
  const normalized = normalizePhone(v);
  const digits = normalized.replace(/[^\d]/g, "");
  return normalized.startsWith("+") && digits.length >= 9 && digits.length <= 15;
}
