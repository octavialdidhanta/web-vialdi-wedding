import { TRACK_KEYS } from "@/analytics/trackRegistry";

/** `public/whatsapp logo.png` — space encoded for URL. */
const WHATSAPP_LOGO_PNG = `${import.meta.env.BASE_URL}whatsapp%20logo.png`;

export function FloatingWhatsApp() {
  // Semua properti: arahkan ke form kontak → Edge Function → WhatsApp Cloud API (bukan wa.me).
  const href = "/contact";

  return (
    <a
      href={href}
      data-track={TRACK_KEYS.whatsappFloatingClick}
      aria-label="Chat WhatsApp"
      className="fixed z-[250] block select-none transition-transform hover:scale-[1.04] active:scale-[0.98] motion-reduce:transition-none"
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
        className="h-[8rem] w-auto max-w-[min(96vw,12rem)] object-contain object-center drop-shadow-[0_18px_40px_rgba(0,0,0,0.3)] sm:h-[9.25rem] sm:max-w-[min(96vw,14rem)]"
      />
    </a>
  );
}
