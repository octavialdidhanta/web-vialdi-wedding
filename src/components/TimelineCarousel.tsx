import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Paperclip } from "lucide-react";

export type TimelineItem = {
  title: string;
  subtitle?: string;
  image: string;
  caption: string;
};

export function TimelineCarousel({ items }: { items: TimelineItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
      {/* Track */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="min-w-0 shrink-0 grow-0 basis-full px-3 md:basis-1/2"
            >
              {/* Title */}
              <div className="mb-4 text-center">
                <h3 className="text-xl font-bold text-primary md:text-2xl">{item.title}</h3>
                {item.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
              {/* Pin on line */}
              <div className="relative mb-6 flex justify-center">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary/60" />
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Paperclip className="h-5 w-5" />
                </div>
              </div>
              {/* Image card */}
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="aspect-[4/3] w-full object-cover"
                />
                <p className="px-5 py-6 text-center text-sm leading-relaxed text-muted-foreground">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button
        type="button"
        aria-label="Previous"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canPrev}
        className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-primary transition-opacity disabled:opacity-30 md:-left-4"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canNext}
        className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-primary transition-opacity disabled:opacity-30 md:-right-4"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
    </div>
  );
}
