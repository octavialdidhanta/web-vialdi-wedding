import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/share/lib/utils";

export type TimelineItem = {
  title: string;
  subtitle?: string;
  image: string;
  caption: string;
};

export function TimelineCarousel({ items }: { items: TimelineItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    slidesToScroll: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      setScrollSnaps(emblaApi.scrollSnapList());
      onSelect();
    });
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy">
            {String(selectedIndex + 1).padStart(2, "0")}
          </span>
          <span className="text-sm text-muted-foreground">
            / {String(items.length).padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-navy transition-all hover:border-[oklch(0.52_0.14_300)] hover:text-[oklch(0.42_0.14_305)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-primary-foreground transition-all hover:bg-[oklch(0.48_0.18_300)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-6 flex">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="min-w-0 shrink-0 grow-0 basis-full pl-6 md:basis-1/2 lg:basis-1/3"
            >
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/95 text-sm font-bold text-navy shadow-md backdrop-blur-sm">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold text-navy">{item.title}</h3>
                  {item.subtitle && (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[oklch(0.48_0.18_300)]">
                      {item.subtitle}
                    </p>
                  )}
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {item.caption}
                  </p>
                  <div className="mt-6 h-1 w-12 rounded-full bg-[oklch(0.55_0.12_300)]/35 transition-all duration-300 group-hover:w-20 group-hover:bg-[oklch(0.48_0.18_300)]" />
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-1 sm:gap-2">
        {scrollSnaps.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Lihat slide ${idx + 1}`}
            aria-current={idx === selectedIndex ? "true" : undefined}
            onClick={() => emblaApi?.scrollTo(idx)}
            className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            <span
              aria-hidden
              className={cn(
                "block h-1.5 rounded-full transition-all duration-300",
                idx === selectedIndex ? "w-8 bg-navy" : "w-1.5 bg-border hover:bg-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
