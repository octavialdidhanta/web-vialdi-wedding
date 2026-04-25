import { cn } from "@/share/lib/utils";

const PAKET_SECTION_ID = "paket-dokumentasi";

const pillBase =
  "inline-flex shrink-0 snap-start rounded-full border px-3 py-2 text-xs font-semibold shadow-sm transition-[color,background-color,border-color,box-shadow,opacity] md:px-3.5 md:text-sm";

const pillInactive =
  "border-border/70 bg-card/90 text-navy hover:border-accent-orange/40 hover:text-accent-orange";

const pillActive =
  "border-accent-orange bg-accent-orange/10 text-accent-orange ring-2 ring-accent-orange/20 hover:border-accent-orange hover:bg-accent-orange/15 hover:ring-accent-orange/30";

const pillComingSoon =
  "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground opacity-90";

export type PaketUnggulanKind = "ads" | "landing" | "content" | "fullfunnel";

/** Navigasi di atas deskripsi Paket unggulan — mobile full bleed. */
export function PaketUnggulanQuickNav({
  active,
  onChange,
}: {
  active: PaketUnggulanKind;
  onChange: (k: PaketUnggulanKind) => void;
}) {
  function jumpToPaketSection() {
    const section = document.getElementById(PAKET_SECTION_ID);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav aria-label="Jenis paket" className="w-full min-w-0">
      <div className="no-scrollbar relative left-1/2 right-1/2 -mx-[50vw] w-screen max-w-[100vw] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-4 scroll-pr-4 px-0 md:static md:mx-0 md:w-full md:max-w-full md:snap-none md:scroll-p-0 md:overflow-visible">
        <ul className="flex w-max flex-nowrap items-stretch justify-start gap-2 px-4 md:flex-wrap md:gap-2.5 md:px-0">
          <li className="shrink-0">
            <button
              type="button"
              className={cn(pillBase, active === "ads" ? pillActive : pillInactive)}
              aria-current={active === "ads" ? "page" : undefined}
              onClick={() => {
                onChange("ads");
                jumpToPaketSection();
              }}
            >
              Paket Ads
            </button>
          </li>
          <li className="shrink-0">
            <button
              type="button"
              className={cn(pillBase, active === "landing" ? pillActive : pillInactive)}
              aria-current={active === "landing" ? "page" : undefined}
              onClick={() => {
                onChange("landing");
                jumpToPaketSection();
              }}
            >
              Paket Landing Page
            </button>
          </li>
          <li className="shrink-0">
            <button
              type="button"
              className={cn(pillBase, active === "content" ? pillActive : pillInactive)}
              aria-current={active === "content" ? "page" : undefined}
              onClick={() => {
                onChange("content");
                jumpToPaketSection();
              }}
            >
              Paket Content
            </button>
          </li>
          <li className="shrink-0">
            <button
              type="button"
              className={cn(pillBase, active === "fullfunnel" ? pillActive : pillInactive)}
              aria-current={active === "fullfunnel" ? "page" : undefined}
              onClick={() => {
                onChange("fullfunnel");
                jumpToPaketSection();
              }}
            >
              Paket Full Funnel
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
