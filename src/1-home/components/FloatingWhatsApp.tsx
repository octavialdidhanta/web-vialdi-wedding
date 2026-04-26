import { useQuery } from "@tanstack/react-query";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import {
  buildWaMeUrl,
  fetchHomeFloatingWhatsappSettings,
  HOME_FLOATING_WHATSAPP_QUERY_KEY,
} from "@/share/homeFloatingWhatsappSettings";
import { WHATSAPP_LOGO_PNG } from "@/1-home/components/FooterContactNavButton";

/**
 * Desktop (md+): tombol WhatsApp mengambang besar. Hanya jika toggle admin ON + nomor valid.
 * Mobile: tidak merender apa pun — slot Contact ada di `MobileHomeStickyFooter`.
 */
export function FloatingWhatsApp() {
  const { data, isLoading } = useQuery({
    queryKey: HOME_FLOATING_WHATSAPP_QUERY_KEY,
    queryFn: fetchHomeFloatingWhatsappSettings,
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return null;
  }

  const waActive = Boolean(data.is_enabled && data.phone_digits);
  if (!waActive) {
    return null;
  }

  const href = buildWaMeUrl(data.phone_digits!, data.prefill_message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-track={TRACK_KEYS.whatsappFloatingClick}
      aria-label="Chat WhatsApp"
      className="fixed z-[250] hidden select-none motion-reduce:transition-none md:block md:transition-transform md:hover:scale-[1.04] md:active:scale-[0.98] motion-reduce:md:transition-none"
      style={{
        right: "calc(env(safe-area-inset-right, 0px) - 0.5rem)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) - 0.5rem)",
      }}
    >
      <img
        src={WHATSAPP_LOGO_PNG}
        alt=""
        width={256}
        height={256}
        decoding="async"
        draggable={false}
        className="block h-[11rem] w-auto max-w-[min(96vw,15rem)] object-contain object-center drop-shadow-[0_18px_40px_rgba(0,0,0,0.3)] sm:h-[13rem] sm:max-w-[min(96vw,17rem)]"
      />
    </a>
  );
}
