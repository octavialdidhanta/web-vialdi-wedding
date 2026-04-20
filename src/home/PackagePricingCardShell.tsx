import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PackageAccordionViewportRefContext } from "@/home/packageAccordionViewport";
import { usePackageConsultOpenerOptional } from "@/home/PackageConsultOpenerContext";

export type PackageLeadSummary = {
  /** Ringkasan teks paket (mis. untuk CRM / lead); header visual tetap dari prop `header`. */
  badgeLabel: string;
  packageName: string;
  strikethroughPrice?: string;
  price: string;
};

type LeadCtx = {
  consultOpen: boolean;
  setConsultOpen: (v: boolean) => void;
};

const PackageCardLeadContext = createContext<LeadCtx | null>(null);

/** Untuk form di dalam kartu — null jika di luar shell. */
export function usePackageCardLeadOptional() {
  return useContext(PackageCardLeadContext);
}

/**
 * Mode browse: kartu mengisi tinggi slot carousel (`md:h-full` dari parent); isi panjang
 * boleh scroll hanya di area accordion (scrollbar disembunyikan lewat `no-scrollbar`).
 */
const shellMdBrowseMode =
  "md:flex-1 md:h-full md:max-h-full md:min-h-0 md:flex md:flex-col md:overflow-hidden md:p-6 lg:p-7";

/** Mode form konsultasi: tinggi mengikuti isi. */
const shellMdFormMode = "md:h-auto md:max-h-none md:overflow-y-visible md:p-6 lg:p-7";

const shellBaseClass =
  "flex flex-col overflow-x-hidden rounded-2xl border border-border bg-card px-3 py-4 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] no-scrollbar scroll-mt-20 " +
  "h-auto max-h-none overflow-y-visible md:min-h-0 ";

export function PackagePricingCardShell({
  header,
  accordion,
  footer,
  cta,
  leadSummary: _leadSummary,
}: {
  header: ReactNode;
  accordion: ReactNode;
  footer: ReactNode;
  cta: ReactNode;
  leadSummary: PackageLeadSummary;
}) {
  const [consultOpen, setConsultOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const accordionViewportRef = useRef<HTMLDivElement>(null);
  const ctx = useMemo(() => ({ consultOpen, setConsultOpen }), [consultOpen]);
  const consultOpener = usePackageConsultOpenerOptional();
  const lastDeepLinkSeq = useRef(0);
  const lastCloseSeq = useRef(0);
  const skipNextConsultScrollIntoView = useRef(false);

  useLayoutEffect(() => {
    const seq = consultOpener?.openSeq ?? 0;
    if (!consultOpener || seq <= lastDeepLinkSeq.current) return;
    lastDeepLinkSeq.current = seq;
    skipNextConsultScrollIntoView.current = true;
    setConsultOpen(true);
  }, [consultOpener, consultOpener?.openSeq]);

  useLayoutEffect(() => {
    const seq = consultOpener?.closeSeq ?? 0;
    if (!consultOpener || seq <= lastCloseSeq.current) return;
    lastCloseSeq.current = seq;
    setConsultOpen(false);
  }, [consultOpener, consultOpener?.closeSeq]);

  useLayoutEffect(() => {
    if (!consultOpen) return;
    const el = shellRef.current;
    if (!el) return;
    el.scrollTop = 0;
    if (skipNextConsultScrollIntoView.current) {
      skipNextConsultScrollIntoView.current = false;
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  }, [consultOpen]);

  const headerWrapClass = "flex shrink-0 flex-col overflow-visible md:min-h-0";

  return (
    <PackageCardLeadContext.Provider value={ctx}>
      <div
        ref={shellRef}
        className={`${shellBaseClass}${consultOpen ? shellMdFormMode : shellMdBrowseMode}`}
      >
        <div className={headerWrapClass}>
          <div className="flex w-full flex-col min-h-[13.25rem] md:min-h-[15.75rem]">{header}</div>
        </div>

        {!consultOpen ? (
          <>
            <div className="mt-2 flex min-h-0 w-full flex-1 flex-col overflow-hidden md:mt-0.5">
              <PackageAccordionViewportRefContext.Provider value={accordionViewportRef}>
                <div
                  ref={accordionViewportRef}
                  data-package-accordion-viewport=""
                  className="no-scrollbar min-h-0 flex-1 overflow-y-auto rounded-xl bg-muted/25 pt-2.5 pb-1 md:pt-0.5"
                >
                  {accordion}
                </div>
              </PackageAccordionViewportRefContext.Provider>
            </div>
            <div className="mt-2 shrink-0 border-t border-border/40 pt-2">
              <div className="flex flex-col justify-start gap-1.5 pt-0.5">{footer}</div>
            </div>
          </>
        ) : null}

        <div
          className={
            consultOpen
              ? "mt-3 flex w-full shrink-0 justify-center border-t border-border/40 pt-3"
              : "mt-2.5 flex w-full shrink-0 justify-center"
          }
        >
          {cta}
        </div>
      </div>
    </PackageCardLeadContext.Provider>
  );
}
