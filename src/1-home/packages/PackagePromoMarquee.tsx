import type { CSSProperties } from "react";

import { ROYAL_WEDDING_GOLD_MARQUEE_PROMO_TEXT } from "@/1-home/packages/royalWeddingGoldMarqueePromoText";
import { cn } from "@/share/lib/utils";

type Props = {
  /** Satu string penuh (satu baris logis); ditampilkan berjalan horizontal. */
  text: string;
  /** Tambahan kelas (default sudah mengikuti kartu Royal: bold, ukuran, warna). */
  className?: string;
};

const MARQUEE_REF_CHAR_LEN = ROYAL_WEDDING_GOLD_MARQUEE_PROMO_TEXT.length;
const MARQUEE_BASE_DURATION_SEC = 22;

function marqueeDurationSecForText(text: string): number {
  const len = text.trim().length;
  if (len < 1) return MARQUEE_BASE_DURATION_SEC;
  return (MARQUEE_BASE_DURATION_SEC * len) / MARQUEE_REF_CHAR_LEN;
}

const marqueeSpanBaseClass =
  "inline-block shrink-0 whitespace-nowrap pr-10 md:pr-14 text-left text-xs font-bold leading-snug text-priority-eyebrow md:text-sm";

/**
 * Satu baris teks promo dengan efek running text (duplikat + translate).
 * Durasi disesuaikan panjang teks agar kecepatan gulir menyerupai kartu Royal Wedding Gold.
 * Menghormati `prefers-reduced-motion`: animasi dimatikan, teks tetap satu baris + scroll horizontal ringan.
 */
export function PackagePromoMarquee({ text, className }: Props) {
  const durationSec = marqueeDurationSecForText(text);
  const trackStyle = {
    "--marquee-duration": `${durationSec}s`,
  } as CSSProperties;

  return (
    <div
      className="package-promo-marquee min-w-0 overflow-hidden"
      role="region"
      aria-label={text}
    >
      <div className="package-promo-marquee__track" style={trackStyle}>
        <span className={cn(marqueeSpanBaseClass, className)}>{text}</span>
        <span className={cn(marqueeSpanBaseClass, className)} aria-hidden>
          {text}
        </span>
      </div>
    </div>
  );
}
