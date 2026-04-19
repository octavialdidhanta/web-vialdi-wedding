/** Kartu yang memakai crop zoom + geser vertikal agar subjek pas di frame. */
const IMAGE_ZOOM_TITLES = new Set([
  "Rias Pengantin Profesional",
  "Koleksi Gaun & Jas Premium",
]);

const cards = [
  {
    title: "Rias Pengantin Profesional",
    subtitle: "Make-up tahan lama, natural di kamera, disesuaikan dengan konsep dan busana Anda.",
    image: "https://jasafotowedding.com/wp-content/uploads/2023/08/Makeup-Pengantin1.png",
    alt: "Pengantin berhijab dengan rias pengantin profesional memegang bunga",
  },
  {
    title: "Koleksi Gaun & Jas Premium",
    subtitle: "Pilihan busana formal berkualitas untuk mempelai dan keluarga — rapi di setiap sudut foto.",
    image: "https://jasafotowedding.com/wp-content/uploads/2023/08/Sewa-Jas7.png",
    alt: "Jas formal di manekin dengan dasi kupu-kupu di latar gelap",
  },
  {
    title: "Dekorasi Pelaminan Impian",
    subtitle: "Tata ruang elegan dari aisle hingga pelaminan, selaras tema dan venue Anda.",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80",
    alt: "Dekorasi pernikahan outdoor dengan bunga",
  },
] as const;

export function FeaturedLayananCards() {
  return (
    <div className="mx-auto max-w-[90rem] px-4 md:px-6">
      <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Layanan Unggulan</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
        Tiga pilar utama yang sering menjadi kebutuhan pasangan: kecantikan, busana, dan suasana
        resepsi yang memukau.
      </p>

      {/* Mobile: full-bleed horizontal strip (break out of page gutters); md+: grid in normal flow */}
      <div
        className="no-scrollbar relative left-1/2 right-1/2 -mx-[50vw] mt-10 w-screen max-w-[100vw] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-4 scroll-pr-4 px-0 pb-2 md:static md:mx-0 md:mt-10 md:w-full md:max-w-full md:snap-none md:scroll-p-0 md:overflow-visible md:pb-0"
        role="region"
        aria-label="Layanan unggulan — geser horizontal untuk melihat kartu lainnya"
      >
        <div className="flex w-max items-stretch gap-3 px-4 md:grid md:w-full md:max-w-none md:px-0 md:grid-cols-3 md:gap-5">
          {cards.map((c) => (
            <article
              key={c.title}
              className="w-[min(20rem,calc(100vw-2.5rem))] max-w-[20rem] shrink-0 snap-start snap-always self-stretch overflow-hidden rounded-[1.125rem] border border-border/80 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] md:w-auto md:max-w-none md:snap-none"
            >
              <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
                <img
                  src={c.image}
                  alt={c.alt}
                  width={800}
                  height={1000}
                  loading="lazy"
                  decoding="async"
                  className={
                    c.title === "Koleksi Gaun & Jas Premium"
                      ? "h-full w-full origin-center object-cover transition-transform duration-500 translate-y-[22%] scale-[1.46] hover:scale-[1.54] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:hover:scale-100"
                      : IMAGE_ZOOM_TITLES.has(c.title)
                        ? "h-full w-full origin-center object-cover transition-transform duration-500 translate-y-[16%] scale-[1.46] hover:scale-[1.54] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:hover:scale-100"
                        : "h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
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
