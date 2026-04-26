import { createContext, useContext, type ComponentProps, type RefObject } from "react";
import { Accordion } from "@/share/ui/accordion";

/** Ref ke kontainer scroll area accordion di kartu paket (diisi oleh `PackagePricingCardShell`). */
export const PackageAccordionViewportRefContext = createContext<RefObject<HTMLDivElement | null> | null>(
  null,
);

type AccordionRootProps = ComponentProps<typeof Accordion>;

const ACCORDION_SCROLL_PAD_PX = 6;
type AccordionValue = string | string[];

/**
 * Hanya menggeser `container` (bukan window / shell kartu). Menjepit trigger terbuka agar utuh
 * terlihat di dalam area scroll accordion; jika tidak muat, utamakan bagian atas trigger.
 */
function scrollOpenTriggerInsideContainer(container: HTMLElement) {
  if (container.clientHeight <= 0) return;

  const trigger = container.querySelector(
    'button[data-state="open"]',
  ) as HTMLElement | null;
  if (!trigger) return;

  const c = container.getBoundingClientRect();
  const e = trigger.getBoundingClientRect();
  const pad = ACCORDION_SCROLL_PAD_PX;

  let nextTop = container.scrollTop;

  if (e.top < c.top + pad) {
    nextTop += e.top - c.top - pad;
  } else if (e.bottom > c.bottom - pad) {
    nextTop += e.bottom - c.bottom + pad;
  }

  const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
  nextTop = Math.max(0, Math.min(nextTop, maxTop));

  if (Math.abs(nextTop - container.scrollTop) < 1) return;

  container.scrollTo({ top: nextTop, behavior: "auto" });
}

/**
 * Root accordion untuk kartu paket: saat item lain dibuka, hanya kontainer accordion (bukan
 * halaman) yang di-scroll agar header item terbuka tetap di area lihat accordion.
 */
export function PackageAccordionRoot({ onValueChange, ...props }: AccordionRootProps) {
  const scrollRef = useContext(PackageAccordionViewportRefContext);

  return (
    <Accordion
      {...props}
      onValueChange={(value: AccordionValue) => {
        onValueChange?.(value as never);
        const openValue = Array.isArray(value) ? value[0] : value;
        if (!openValue || !scrollRef?.current) return;
        const container = scrollRef.current;

        // Dua frame: biarkan Radix menyelesaikan layout sebelum baca `getBoundingClientRect`,
        // supaya mengurangi forced reflow yang terlihat di Lighthouse.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollOpenTriggerInsideContainer(container));
        });
      }}
    />
  );
}
