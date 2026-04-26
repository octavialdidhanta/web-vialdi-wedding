/** Digit saja dari input (hapus titik, koma, spasi, dll.). */
function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Input nominal IDR: tampilkan pemisah ribuan titik (format Indonesia).
 * Mendeteksi awalan "Rp" (opsional, case-insensitive).
 */
export function formatIdrThousandsInput(raw: string): string {
  const hasRp = /^\s*rp\s*/i.test(raw);
  const digits = digitsOnly(raw);
  if (!digits) return hasRp ? "Rp " : "";
  const core = digits.replace(/^0+(?=\d)/, "") || "0";
  const dotted = core.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return hasRp ? `Rp ${dotted}` : dotted;
}

/**
 * Untuk "label harga": jika seperti nominal (hanya angka / titik / spasi, opsional Rp), pakai titik ribuan.
 * Jika ada huruf (mis. "Fee 10%"), biarkan teks apa adanya.
 */
export function formatPriceLikeInput(raw: string): string {
  const t = raw;
  const afterRp = t.replace(/^\s*rp\s*/i, "");
  if (afterRp.trim() === "") {
    return /^\s*rp\s*/i.test(t) ? "Rp " : "";
  }
  if (/[a-zA-Z]/.test(afterRp)) {
    return t;
  }
  return formatIdrThousandsInput(t);
}
