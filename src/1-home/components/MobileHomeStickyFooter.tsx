import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BadgePercent, HelpCircle, Instagram, Phone, ShieldCheck } from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  Icon: typeof Instagram;
  kind?: "scroll" | "route";
  to?: string;
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const header = document.querySelector("header");
  const headerH = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
  const y = window.scrollY + el.getBoundingClientRect().top - headerH - 12;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}

export function MobileHomeStickyFooter({
  instagramId,
  hargaPaketId,
  garansiId,
  faqId,
}: {
  instagramId: string;
  hargaPaketId: string;
  garansiId: string;
  faqId: string;
}) {
  const navigate = useNavigate();
  const items = useMemo<NavItem[]>(
    () => [
      { id: instagramId, label: "Instagram", Icon: Instagram },
      { id: hargaPaketId, label: "Harga paket", Icon: BadgePercent },
      { id: garansiId, label: "Garansi", Icon: ShieldCheck },
      { id: faqId, label: "FAQ", Icon: HelpCircle },
      { id: "contact", label: "Contact", Icon: Phone, kind: "route", to: "/contact" },
    ],
    [faqId, garansiId, hargaPaketId, instagramId],
  );

  const onClick = useCallback((item: NavItem) => {
    if (item.kind === "route" && item.to) {
      navigate(item.to);
      return;
    }
    scrollToId(item.id);
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[260] border-t border-border/60 bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="navigation"
      aria-label="Navigasi cepat halaman"
    >
      <div className="mx-auto grid max-w-[90rem] grid-cols-5 gap-1 px-1 py-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onClick(item)}
            className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-0.5 text-[0.5625rem] font-medium leading-none text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.48_0.2_300)]/40"
            aria-label={item.label}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-[oklch(0.48_0.2_300)] shadow-sm">
              <item.Icon className="h-3.5 w-3.5" aria-hidden strokeWidth={1.85} />
            </div>
            <span className="w-full truncate text-center">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

