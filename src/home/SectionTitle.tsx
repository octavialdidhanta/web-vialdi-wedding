import type { ReactNode } from "react";

import { cn } from "@/share/lib/utils";

export function SectionTitle({
  title,
  subtitle,
  align = "left",
  belowTitle,
  className,
  subtitleClassName,
}: {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** Mengganti strip aksen bawah judul. `undefined` = strip default; `null` = tanpa aksen. */
  belowTitle?: ReactNode | null;
  /** Gabungkan dengan kelas root (mis. `text-center md:text-left`). */
  className?: string;
  /** Kelas tambahan pada paragraf subtitle. */
  subtitleClassName?: string;
}) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      <h2 className="text-3xl font-bold leading-tight text-navy md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {belowTitle === undefined ? (
        <>
          <div
            className={cn(
              "mt-3 h-1 w-16 rounded-full bg-[oklch(0.48_0.22_300)]",
              align === "center" && "mx-auto",
            )}
          />
          {subtitle && (
            <p
              className={cn(
                "mt-5 text-base text-muted-foreground md:text-lg",
                align === "center" ? "mx-auto max-w-2xl" : "max-w-3xl",
                subtitleClassName,
              )}
            >
              {subtitle}
            </p>
          )}
        </>
      ) : (
        <>
          {belowTitle ? (
            <div
              className={cn(
                "mt-4 min-w-0 w-full md:mt-5",
                align === "center" && "flex flex-col items-center",
              )}
            >
              {belowTitle}
            </div>
          ) : null}
          {subtitle && (
            <p
              className={cn(
                "mt-4 text-base text-muted-foreground md:mt-5 md:text-lg",
                align === "center" ? "mx-auto max-w-2xl" : "max-w-3xl",
                subtitleClassName,
              )}
            >
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  );
}

