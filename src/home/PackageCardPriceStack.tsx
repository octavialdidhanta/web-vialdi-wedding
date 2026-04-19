import type { ReactNode } from "react";

import { cn } from "@/share/lib/utils";

type Props = {
  /** Garis pemisah tipis di atas blok nominal (sama di semua kartu yang memakainya). */
  showDivider?: boolean;
  /** Mis. lencana best seller — kolom kiri, vertikal center dengan nominal. */
  leading?: ReactNode;
  children: ReactNode;
};

/**
 * Area nominal di dalam pembungkus harga: tinggi baris diseragamkan antar kartu,
 * divider selebar pembungkus (bukan max-w-xs).
 */
export function PackageCardPriceStack({ showDivider = false, leading, children }: Props) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col", showDivider && "gap-2 md:gap-2.5")}>
      {showDivider ? <div className="h-0 w-full shrink-0 border-t border-border" /> : null}
      <div
        className={cn(
          "flex min-h-[4.5rem] w-full min-w-0 items-center",
          leading != null ? "gap-0" : "gap-2 md:gap-2",
        )}
      >
        {leading != null ? (
          <div className="shrink-0 self-center -mr-2.5 max-w-[min(100%,5.5rem)] md:-mr-4 md:max-w-[min(100%,6.25rem)]">
            {leading}
          </div>
        ) : null}
        <div
          className={cn(
            "min-w-0 flex-1 text-left",
            leading != null && "-ml-0.5 md:-ml-1",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
