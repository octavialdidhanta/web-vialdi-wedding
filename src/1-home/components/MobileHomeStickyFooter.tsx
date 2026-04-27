import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgePercent, HelpCircle, Instagram, ShieldCheck } from "lucide-react";
import {
  FooterContactNavButton,
  footerContactIconBoxClass,
  footerContactNavButtonClass,
} from "@/1-home/components/FooterContactNavButton";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import {
  buildWaMeUrl,
  fetchHomeFloatingWhatsappSettings,
  HOME_FLOATING_WHATSAPP_QUERY_KEY,
} from "@/share/homeFloatingWhatsappSettings";

/**
 * Padding bawah konten halaman (mobile) agar footer tidak tertutup bar navigasi fixed.
 * ≈ tinggi bar (ikon 36px + label + py + border) + safe area — jangan terlalu besar agar tidak
 * terlihat “lompat” jauh di atas bar; jangan terlalu kecil agar teks footer tidak ketutup.
 */
export const mobileHomeStickyFooterPageBottomPaddingClass =
  "pb-[calc(3.875rem+env(safe-area-inset-bottom,0px))] md:pb-0";

type ScrollNavItem = {
  id: string;
  label: string;
  Icon: typeof Instagram;
};

type NavItem = ScrollNavItem | { id: "contact"; kind: "contact-link"; label: "Contact" };

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
  const { data: waSettings } = useQuery({
    queryKey: HOME_FLOATING_WHATSAPP_QUERY_KEY,
    queryFn: fetchHomeFloatingWhatsappSettings,
    staleTime: 60_000,
  });

  const waFooterActive = Boolean(
    waSettings?.is_enabled && waSettings.phone_digits,
  );

  const items = useMemo<NavItem[]>(
    () => [
      { id: hargaPaketId, label: "Harga paket", Icon: BadgePercent },
      { id: instagramId, label: "Instagram", Icon: Instagram },
      { id: garansiId, label: "Garansi", Icon: ShieldCheck },
      { id: faqId, label: "FAQ", Icon: HelpCircle },
      { id: "contact", kind: "contact-link", label: "Contact" },
    ],
    [faqId, garansiId, hargaPaketId, instagramId],
  );

  const onScrollItem = useCallback((item: ScrollNavItem) => {
    scrollToId(item.id);
  }, []);

  const trackKeyForScrollItem = (id: string) => {
    if (id === hargaPaketId) return TRACK_KEYS.homeStickyHargaPaketCta;
    if (id === instagramId) return TRACK_KEYS.homeStickyInstagramCta;
    if (id === garansiId) return TRACK_KEYS.homeStickyGaransiCta;
    if (id === faqId) return TRACK_KEYS.homeStickyFaqCta;
    return TRACK_KEYS.homeStickyScrollCta;
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[260] border-t border-border/60 bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="navigation"
      aria-label="Navigasi cepat halaman"
    >
      <div className="mx-auto grid max-w-[90rem] grid-cols-5 gap-1 px-1 py-1">
        {items.map((item) =>
          item.kind === "contact-link" ? (
            waFooterActive && waSettings?.phone_digits ? (
              <FooterContactNavButton
                key={item.id}
                variant="whatsapp"
                href={buildWaMeUrl(waSettings.phone_digits, waSettings.prefill_message)}
                className="w-full"
              />
            ) : (
              <FooterContactNavButton key={item.id} variant="contact" className="w-full" />
            )
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => onScrollItem(item)}
              className={footerContactNavButtonClass}
              aria-label={item.label}
              data-track={trackKeyForScrollItem(item.id)}
            >
              <div className={footerContactIconBoxClass}>
                <item.Icon className="h-4 w-4" aria-hidden strokeWidth={1.85} />
              </div>
              <span className="w-full truncate text-center">{item.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
