import { TimelineCarousel, type TimelineItem } from "@/home/TimelineCarousel";
import imgFounder from "@/about-us/assets/founder.jpg?w=1200&format=webp";
import imgThumb1 from "@/home/assets/youtube/mAoEjRTJKC4-hqdefault.jpg?w=1200&format=webp";
import imgThumb2 from "@/home/assets/youtube/K9anWRATqdo-hqdefault.jpg?w=1200&format=webp";
import imgBefore from "@/home/assets/before-after/before.webp?w=1200&format=webp";
import imgAfter from "@/home/assets/before-after/after.webp?w=1200&format=webp";

const items: TimelineItem[] = [
  {
    title: "PT. AMG",
    subtitle: "Advertising",
    image: "/amg.png",
    caption: "Membantu meningkatkan kepuasan pelanggan melalui strategi campaign dan konten.",
  },
  {
    title: "PT IMA",
    subtitle: "E-commerce & Retail",
    image: "/ima.png",
    caption: "Mendukung pertumbuhan penjualan dengan optimasi funnel dan iklan yang terukur.",
  },
  {
    title: "PT Jilbert Kreasindo",
    subtitle: "Automotive Service",
    image: "/jilbert.png",
    caption: "Meningkatkan lead acquisition lewat perbaikan landing page dan conversion rate.",
  },
  {
    title: "PT Cashtree",
    subtitle: "Advertising & Mobile App",
    image: "/cashtree.png",
    caption: "Membantu peningkatan jumlah install melalui setup tracking dan iterasi creative.",
  },
  {
    title: "PT Newfemme",
    subtitle: "Advertising & Mobile App",
    image: "/newfemme.png",
    caption: "Dorong pertumbuhan install dengan eksperimen audience dan optimasi performa rutin.",
  },
  {
    title: "PT Lumen Indonesia",
    subtitle: "Retail",
    image: "/lumen.png",
    imageClassName: "scale-110",
    caption: "Membangun fondasi digital dari nol dan meningkatkan penjualan dengan strategi bertahap.",
  },
];

export function IndustryExperienceSection() {
  return (
    <div className="mx-auto max-w-[90rem] px-2.5 md:px-6">
      <div className="mb-8 max-w-4xl">
        <h2 className="text-3xl font-bold leading-tight text-navy md:text-4xl">
          Kami memiliki pengalaman dalam membantu berbagai industri
        </h2>
        <div className="mt-3 h-1 w-16 rounded-full bg-accent-orange" aria-hidden />
      </div>

      {/* Mobile: samakan style dengan "Layanan Unggulan" (strip swipe + snap). */}
      <div
        className="no-scrollbar relative left-1/2 right-1/2 -mx-[50vw] w-screen max-w-[100vw] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-2.5 scroll-pr-2.5 px-0 pb-2 md:hidden"
        role="region"
        aria-label="Pengalaman lintas industri — geser horizontal untuk melihat kartu lainnya"
      >
        <div className="flex w-max items-stretch gap-3 px-2.5">
          {items.map((item, idx) => (
            <article
              key={`${item.title}-${idx}`}
              className="w-[min(20rem,calc(100vw-1.25rem))] max-w-[20rem] shrink-0 snap-start snap-always self-stretch overflow-hidden rounded-[1.125rem] border border-border/80 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={600}
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/95 text-xs font-bold text-navy shadow-md backdrop-blur-sm">
                  {String(idx + 1).padStart(2, "0")}
                </div>
              </div>
              <div className="border-t border-border/60 bg-[oklch(0.97_0.01_90)] px-3 py-3.5 md:px-5 md:py-5">
                <h3 className="text-base font-bold text-navy">{item.title}</h3>
                {item.subtitle ? (
                  <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wider text-accent-orange">
                    {item.subtitle}
                  </p>
                ) : null}
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.caption}</p>
                <div className="mt-3 h-0.5 w-10 rounded-full bg-accent-orange/35" aria-hidden />
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Desktop+: tetap pakai carousel existing (punya counter + arrows). */}
      <div className="hidden md:block">
        <TimelineCarousel items={items} />
      </div>
    </div>
  );
}

