import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { WeddingPackageSection } from "@/blog/weddingPackages";
import { cn } from "@/share/lib/utils";
import { WeddingPackageSectionBody } from "@/1-home/packages/weddingPackageCardSectionBody";
import {
  weddingPackageSectionContentClass,
  weddingPackageSectionTriggerClass,
} from "@/1-home/packages/weddingPackageCardSectionStyles";

/**
 * Satu panel terbuka, bisa ditutup semua — mirip Radix `single` + `collapsible`,
 * tanpa pengukuran tinggi DOM (hindari forced reflow di embed blog / admin).
 */
export function WeddingPackageLightweightSections({
  sections,
}: {
  sections: WeddingPackageSection[];
}) {
  const [openId, setOpenId] = useState<string | undefined>(undefined);

  return (
    <div className="w-full space-y-2">
      {sections.map((s) => {
        const open = openId === s.id;
        return (
          <div key={s.id} className="border-0">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId((cur) => (cur === s.id ? undefined : s.id))}
              className={cn(
                "flex w-full items-center justify-between gap-2 text-left transition-colors",
                weddingPackageSectionTriggerClass,
                open && "rounded-b-none bg-[var(--package-purple-open)]",
              )}
            >
              <span>{s.title}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-white transition-transform duration-200",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {open ? (
              <div className={weddingPackageSectionContentClass}>
                <WeddingPackageSectionBody s={s} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
