/** Shared validators for contact & wedding package lead forms. */

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
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

export function isValidPhone(v: string) {
  const normalized = normalizePhone(v);
  const digits = normalized.replace(/[^\d]/g, "");
  return normalized.startsWith("+") && digits.length >= 9 && digits.length <= 15;
}
