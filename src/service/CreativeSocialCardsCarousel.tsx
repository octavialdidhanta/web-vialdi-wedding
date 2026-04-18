import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ServiceOfferItem } from "@/service/content";
import { servicesCtas } from "@/service/content";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/share/ui/carousel";
import { cn } from "@/share/lib/utils";

type Props = {
  items: ServiceOfferItem[];
};

/** Kartu aktif paling depan; kartu “depan” (index > selected) di atas kartu “belakang” (sudah dilihat). */
function stackZIndex(index: number, selected: number): number {
  if (index === selected) {
    return 100;
  }
  if (index > selected) {
    return 70 - (index - selected);
  }
  return 12 + index;
}

export function CreativeSocialCardsCarousel({ items }: Props) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,18.5rem)] min-[900px]:max-w-[20rem] min-[1100px]:max-w-[21.5rem]">
      <Carousel
        opts={{
          align: "center",
          loop: false,
          dragFree: false,
          containScroll: "trimSnaps",
        }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="-ml-0 py-6">
          {items.map((it, index) => {
            const Icon = it.icon;
            const detailHref = it.detailHref ?? servicesCtas.primaryHref;
            const isActive = index === selected;
            const stackZ = stackZIndex(index, selected);

            return (
              <CarouselItem
                key={`${it.title}-${index}`}
                className={cn(
                  "relative min-w-0 shrink-0 pl-0 transition-[margin] duration-500 ease-out",
                  "basis-[94%]",
                  index > 0 &&
                    "-ml-[52%] min-[900px]:-ml-[50%] min-[1100px]:-ml-[48%] min-[1280px]:-ml-[46%]",
                )}
                style={{ zIndex: stackZ }}
                aria-current={isActive ? "true" : undefined}
              >
                <div
                  className={cn(
                    "transition-[transform,opacity,filter] duration-500 ease-out will-change-transform",
                    isActive ? "scale-100 opacity-100" : "scale-[0.82] opacity-[0.68]",
                    !isActive && index < selected && "origin-[90%_50%]",
                    !isActive && index > selected && "origin-[10%_50%]",
                  )}
                >
                  <div
                    className={cn(
                      "group flex min-h-[210px] flex-col rounded-xl border bg-background px-3 py-4 text-center shadow-sm sm:min-h-[220px]",
                      isActive
                        ? "border-border shadow-[var(--shadow-elegant)]"
                        : "border-border/50 shadow-none ring-1 ring-black/[0.03]",
                    )}
                  >
                    <div
                      className={cn(
                        "mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy transition-colors sm:h-12 sm:w-12",
                        isActive
                          ? "bg-secondary group-hover:bg-accent-orange/15 group-hover:text-accent-orange"
                          : "bg-secondary/70 text-navy/85",
                      )}
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                    </div>
                    <div
                      className={cn(
                        "mt-3 min-h-0 flex-1 text-xs font-semibold leading-snug sm:text-[13px]",
                        isActive ? "text-navy" : "text-navy/80",
                      )}
                    >
                      {it.title}
                    </div>
                    <Link
                      to={detailHref}
                      className={cn(
                        "mt-3 inline-flex min-h-8 w-full items-center justify-center rounded-full border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition-colors hover:border-accent-orange hover:text-accent-orange sm:text-xs",
                        isActive
                          ? "border-border bg-card text-navy"
                          : "border-border/60 bg-background/95 text-navy/85",
                      )}
                      aria-label={`Lihat detail: ${it.title}`}
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious
          type="button"
          variant="outline"
          className="left-0 top-1/2 z-[110] h-8 w-8 -translate-y-1/2 border-border bg-background/95 shadow-sm hover:bg-accent-orange/10"
        />
        <CarouselNext
          type="button"
          variant="outline"
          className="right-0 top-1/2 z-[110] h-8 w-8 -translate-y-1/2 border-border bg-background/95 shadow-sm hover:bg-accent-orange/10"
        />
      </Carousel>
    </div>
  );
}
