import type { ReactNode } from "react";

type Props = {
  /** Baris harga (divider, badge, strikethrough, nominal). */
  priceArea: ReactNode;
  /** Teks di bawah harga (mis. marquee). */
  footNote?: ReactNode;
};

/**
 * Pembungkus blok harga + catatan: lebar penuh kolom kartu, tinggi minimum seragam (mobile + desktop),
 * padding rapat; isi boleh lebih tinggi jika perlu (tanpa spasi kosong artifisial di dalam).
 */
export function PackageCardPricePromoWrap({ priceArea, footNote = null }: Props) {
  return (
    <div
      data-package-card-price-promo=""
      className="package-card-price-promo flex w-full min-w-0 shrink-0 flex-col gap-1 rounded-xl border border-[var(--package-purple-solid)]/22 bg-gradient-to-b from-[oklch(0.97_0.015_300)]/90 via-card to-card py-1.5 pl-1.5 pr-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-inset ring-black/[0.04] min-h-[6.875rem]"
    >
      <div className="min-w-0 shrink-0">{priceArea}</div>
      {footNote != null ? (
        <div className="min-w-0 shrink-0 overflow-hidden [&_p]:leading-tight">
          {footNote}
        </div>
      ) : null}
    </div>
  );
}
