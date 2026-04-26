import { useEffect, useMemo, useState } from "react";

/** Akhir promo hitung-mundur (zona WIB). Sesuaikan saat promo berubah. */
export const PROMO_END_MS = new Date("2026-06-29T23:59:59+07:00").getTime();

export function usePromoCountdown(targetMs: number = PROMO_END_MS) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  return useMemo(() => {
    const diff = Math.max(0, targetMs - now);
    const sec = Math.floor(diff / 1000) % 60;
    const min = Math.floor(diff / (1000 * 60)) % 60;
    const hrs = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return { days, hrs, min, sec };
  }, [now, targetMs]);
}
