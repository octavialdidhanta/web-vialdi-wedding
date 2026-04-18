/**
 * Kunci resmi untuk agregasi global (CTR, konversi service).
 * Pasang di markup: data-track="contact_cta" (nilai harus salah satu konstanta di bawah).
 */
export const TRACK_KEYS = {
  /** Tombol / tautan utama ke halaman kontak (header, hero, blog CTA, dll.) */
  contactCta: "contact_cta",
  /** Kirim formulir subscribe footer (jika nanti terhubung ke backend) */
  footerSubscribe: "footer_subscribe_submit",
  /** Logo / brand ke home */
  navLogoHome: "nav_logo_home",
} as const;

export type TrackKey = (typeof TRACK_KEYS)[keyof typeof TRACK_KEYS];

export function isKnownTrackKey(v: string | null | undefined): v is TrackKey {
  if (!v) return false;
  return (Object.values(TRACK_KEYS) as string[]).includes(v);
}
