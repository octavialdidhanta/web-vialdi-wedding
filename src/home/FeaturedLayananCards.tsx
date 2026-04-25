/** Kartu yang memakai crop zoom + geser vertikal agar subjek pas di frame. */
const IMAGE_ZOOM_TITLES = new Set(["Koleksi Gaun & Jas Premium"]);

const cards = [
  {
    title: "Content & Creative",
    subtitle: "Konten & visual yang mendorong klik, trust, dan action—bukan sekadar ramai.",
    image: "/content%20and%20creative.png",
    alt: "Ilustrasi layanan content dan creative",
    imgWidth: 800,
    imgHeight: 1000,
  },
  {
    title: "Performance Ads",
    subtitle: "Iklan yang terukur untuk lead & penjualan (setup, testing, scaling).",
    image: "/performance%20ads.png",
    alt: "Ilustrasi layanan performance ads",
    imgWidth: 640,
    imgHeight: 800,
  },
  {
    title: "Landing Page & CRO",
    subtitle: "Optimasi konversi lewat landing page cepat, jelas, dan siap A/B test.",
    image: "/Landing%20page.png",
    alt: "Ilustrasi layanan landing page dan CRO",
    imgWidth: 720,
    imgHeight: 902,
  },
  {
    title: "Analytics & Reporting",
    subtitle: "Tracking KPI, laporan ringkas, dan insight untuk keputusan cepat.",
    image: "/analitycs.png",
    alt: "Ilustrasi layanan analytics dan reporting",
    imgWidth: 720,
    imgHeight: 720,
  },
] as const;

export function FeaturedLayananCards() {
  return (
    <div className="mx-auto max-w-[90rem] px-2.5 md:px-6">
      <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Layanan Unggulan</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
        Empat layanan inti untuk menaikkan leads dan penjualan—fokus hasil, bukan sekadar aktivitas.
      </p>

      {/* Mobile: full-bleed horizontal strip (break out of page gutters); md+: grid in normal flow */}
      <div
        className="no-scrollbar relative left-1/2 right-1/2 -mx-[50vw] mt-10 w-screen max-w-[100vw] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-2.5 scroll-pr-2.5 px-0 pb-2 md:static md:mx-0 md:mt-10 md:w-full md:max-w-full md:snap-none md:scroll-p-0 md:overflow-visible md:pb-0"
        role="region"
        aria-label="Layanan unggulan — geser horizontal untuk melihat kartu lainnya"
      >
        <div className="flex w-max items-stretch gap-3 px-2.5 md:grid md:w-full md:max-w-none md:px-0 md:grid-cols-4 md:gap-5">
          {cards.map((c) => (
            <article
              key={c.title}
              className="w-[min(20rem,calc(100vw-1.25rem))] max-w-[20rem] shrink-0 snap-start snap-always self-stretch overflow-hidden rounded-[1.125rem] border border-border/80 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] md:w-auto md:max-w-none md:snap-none"
            >
              <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
                <img
                  src={c.image}
                  alt={c.alt}
                  width={c.imgWidth}
                  height={c.imgHeight}
                  sizes="(max-width: 767px) min(20rem, calc(100vw - 1.25rem)), (max-width: 1280px) 33vw, 24rem"
                  loading="lazy"
                  decoding="async"
                  className={
                    c.title === "Koleksi Gaun & Jas Premium"
                      ? "h-full w-full origin-center object-cover transition-transform duration-500 translate-y-[22%] scale-[1.46] hover:scale-[1.54] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:hover:scale-100"
                      : IMAGE_ZOOM_TITLES.has(c.title)
                        ? "h-full w-full origin-center object-cover transition-transform duration-500 translate-y-[16%] scale-[1.46] hover:scale-[1.54] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:hover:scale-100"
                        : "h-full w-full object-cover object-center transition-transform duration-500 hover:scale-[1.03]"
                  }
                />
              </div>
              <div className="border-t border-border/60 bg-[oklch(0.97_0.01_90)] px-3 py-3.5 text-center md:px-5 md:py-5">
                <h3 className="text-base font-bold text-navy md:text-lg">{c.title}</h3>
                <p className="mt-2 text-left text-xs leading-relaxed text-muted-foreground md:text-sm">
                  {c.subtitle}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
