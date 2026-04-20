import makeupRiasFeatured from "@/home/assets/makeup/Untitled design (1)_11zon.jpg?w=640&format=webp";
import jasPremiumFeatured from "@/home/assets/makeup/sewa-jas-premium.jpg?w=720&format=webp";
import dekorasiPelaminFeatured from "@/home/assets/makeup/dekorasi-pelaminan-impian.jpg?w=800&format=webp";
import dokumentasiFeatured from "@/home/assets/hero/DSC00768_11zon.webp?w=720&format=webp";

/** Kartu yang memakai crop zoom + geser vertikal agar subjek pas di frame. */
const IMAGE_ZOOM_TITLES = new Set(["Koleksi Gaun & Jas Premium"]);

const cards = [
  {
    title: "Rias Pengantin Profesional",
    subtitle: "Make-up tahan lama, natural di kamera, disesuaikan dengan konsep dan busana Anda.",
    image: makeupRiasFeatured,
    alt: "Pengantin berhijab dengan rias pengantin profesional memegang bunga",
    imgWidth: 640,
    imgHeight: 800,
  },
  {
    title: "Koleksi Gaun & Jas Premium",
    subtitle: "Pilihan busana formal berkualitas untuk mempelai dan keluarga — rapi di setiap sudut foto.",
    image: jasPremiumFeatured,
    alt: "Jas formal di manekin dengan dasi kupu-kupu di latar gelap",
    imgWidth: 720,
    imgHeight: 902,
  },
  {
    title: "Dekorasi Pelaminan Impian",
    subtitle: "Tata ruang elegan dari aisle hingga pelaminan, selaras tema dan venue Anda.",
    image: dekorasiPelaminFeatured,
    alt: "Dekorasi pernikahan outdoor dengan bunga",
    imgWidth: 800,
    imgHeight: 1000,
  },
  {
    title: "Dokumentasi",
    subtitle: "Tim foto & video yang paham ritme acara — hasil rapi, warna natural, dan siap album & sosial media.",
    image: dokumentasiFeatured,
    alt: "Pasangan pengantin dalam suasana pernikahan elegan",
    imgWidth: 720,
    imgHeight: 720,
  },
] as const;

export function FeaturedLayananCards() {
  return (
    <div className="mx-auto max-w-[90rem] px-2.5 md:px-6">
      <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Layanan Unggulan</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
        Empat pilar utama yang sering menjadi kebutuhan pasangan: kecantikan, busana, suasana resepsi,
        dan dokumentasi yang rapi.
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
