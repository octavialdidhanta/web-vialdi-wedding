import { useEffect, useState } from "react";

import { cn } from "@/share/lib/utils";

const PAKET_SECTION_ID = "paket-dokumentasi";

const pillBase =
  "inline-flex shrink-0 snap-start rounded-full border px-3 py-2 text-xs font-semibold shadow-sm transition-[color,background-color,border-color,box-shadow,opacity] md:px-3.5 md:text-sm";

const pillInactive =
  "border-border/70 bg-card/90 text-navy hover:border-[oklch(0.48_0.22_300)]/45 hover:text-[oklch(0.34_0.1_305)]";

const pillActive =
  "border-[oklch(0.48_0.22_300)] bg-[oklch(0.97_0.05_300)] text-[oklch(0.28_0.1_305)] ring-2 ring-[oklch(0.48_0.22_300)]/30 hover:border-[oklch(0.42_0.2_300)] hover:bg-[oklch(0.96_0.06_300)] hover:ring-[oklch(0.48_0.22_300)]/45";

const pillComingSoon =
  "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground opacity-90";

/** Navigasi di atas deskripsi Paket unggulan — mobile full bleed; Paket Dokumentasi aktif saat section terlihat. */
export function PaketUnggulanQuickNav() {
  const [dokumentasiActive, setDokumentasiActive] = useState(false);

  useEffect(() => {
    const section = document.getElementById(PAKET_SECTION_ID);
    if (!section) return;

    const obs = new IntersectionObserver(
      ([e]) => {
        setDokumentasiActive(Boolean(e?.isIntersecting));
      },
      { root: null, rootMargin: "-12% 0px -45% 0px", threshold: [0, 0.15, 0.35] },
    );
    obs.observe(section);

    const onHash = () => {
      if (window.location.hash === `#${PAKET_SECTION_ID}`) setDokumentasiActive(true);
    };
    window.addEventListener("hashchange", onHash);
    onHash();

    return () => {
      obs.disconnect();
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  return (
    <nav aria-label="Jenis paket" className="w-full min-w-0">
      <div className="no-scrollbar relative left-1/2 right-1/2 -mx-[50vw] w-screen max-w-[100vw] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-4 scroll-pr-4 px-0 md:static md:mx-0 md:w-full md:max-w-full md:snap-none md:scroll-p-0 md:overflow-visible">
        <ul className="flex w-max flex-nowrap items-stretch justify-start gap-2 px-4 md:flex-wrap md:gap-2.5 md:px-0">
          <li className="shrink-0">
            <a
              href={`#${PAKET_SECTION_ID}`}
              className={cn(pillBase, dokumentasiActive ? pillActive : pillInactive)}
              aria-current={dokumentasiActive ? "page" : undefined}
            >
              Paket Dokumentasi
            </a>
          </li>
          <li className="shrink-0">
            <span className={cn(pillBase, pillComingSoon)} title="Paket belum tersedia">
              Paket Dekor
            </span>
          </li>
          <li className="shrink-0">
            <span className={cn(pillBase, pillComingSoon)} title="Paket belum tersedia">
              Paket rias & gaun
            </span>
          </li>
          <li className="shrink-0">
            <span className={cn(pillBase, pillComingSoon)} title="Paket belum tersedia">
              Paket all in one
            </span>
          </li>
        </ul>
      </div>
    </nav>
  );
}
