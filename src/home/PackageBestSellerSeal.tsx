const BEST_SELLER_BADGE_URL =
  "https://jasafotowedding.com/wp-content/uploads/2023/08/best-seller.png";

/** Lencana best seller (PNG transparan), kecil — dipakai di samping kiri blok harga (`flex` + `gap`). */
export function PackageBestSellerSeal() {
  return (
    <div className="shrink-0 self-center">
      <img
        src={BEST_SELLER_BADGE_URL}
        alt="Best seller"
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        className="h-auto w-14 max-w-full object-contain sm:w-16 md:w-[4.5rem]"
      />
    </div>
  );
}
