import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { buildSessionTouchEvent, getOrCreateSessionId, getRequiredWebId } from "@/analytics/sendAnalyticsBatch";

function toWaMeNumber(input: string): string {
  return input.replace(/[^\d]/g, "");
}

export function FloatingWhatsApp() {
  const rawNumber = (import.meta.env.VITE_WHATSAPP_CHAT_NUMBER as string | undefined) ?? "";
  const waNumber = toWaMeNumber(rawNumber);

  const href =
    waNumber.length > 0
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Halo Vialdi Wedding, saya ingin konsultasi.")}`
      : "/contact";

  return (
    <a
      href={href}
      data-track={TRACK_KEYS.whatsappFloatingClick}
      target={waNumber.length > 0 ? "_blank" : undefined}
      rel={waNumber.length > 0 ? "noopener noreferrer" : undefined}
      aria-label="Chat WhatsApp"
      className="fixed z-[250] inline-flex select-none items-center justify-center transition-transform hover:scale-[1.04] active:scale-[0.98] motion-reduce:transition-none"
      onClick={() => {
        if (waNumber.length === 0) return;
        try {
          const session_id = getOrCreateSessionId();
          const web_id = getRequiredWebId();
          const touch = buildSessionTouchEvent();

          // Best-effort: persist explicit WA click event server-side and trigger owner notification.
          void fetch(
            `${(import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, "")}/functions/v1/wa-click-track`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
              },
              keepalive: true,
              body: JSON.stringify({
                session_id,
                web_id,
                path: window.location.pathname || "/",
                target_url: href,
                ua_hash: touch.type === "session_touch" ? touch.ua_hash : undefined,
                attribution: {
                  landing_url: touch.type === "session_touch" ? touch.landing_url : undefined,
                  referrer: touch.type === "session_touch" ? touch.referrer : undefined,
                  utm_source: touch.type === "session_touch" ? touch.utm_source : undefined,
                  utm_medium: touch.type === "session_touch" ? touch.utm_medium : undefined,
                  utm_campaign: touch.type === "session_touch" ? touch.utm_campaign : undefined,
                  utm_content: touch.type === "session_touch" ? touch.utm_content : undefined,
                  utm_term: touch.type === "session_touch" ? touch.utm_term : undefined,
                  meta_campaign_name: touch.type === "session_touch" ? touch.meta_campaign_name : undefined,
                  meta_adset_name: touch.type === "session_touch" ? touch.meta_adset_name : undefined,
                  meta_ad_name: touch.type === "session_touch" ? touch.meta_ad_name : undefined,
                  has_gclid: touch.type === "session_touch" ? touch.has_gclid : undefined,
                  has_fbclid: touch.type === "session_touch" ? touch.has_fbclid : undefined,
                  has_msclkid: touch.type === "session_touch" ? touch.has_msclkid : undefined,
                  has_gbraid: touch.type === "session_touch" ? touch.has_gbraid : undefined,
                  has_wbraid: touch.type === "session_touch" ? touch.has_wbraid : undefined,
                },
                ts: new Date().toISOString(),
              }),
            },
          ).catch(() => {});
        } catch {
          // ignore
        }
      }}
      style={{
        right: "max(0.125rem, env(safe-area-inset-right))",
        bottom: "max(0.125rem, env(safe-area-inset-bottom))",
      }}
    >
      <span
        aria-hidden
        className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_34px_rgba(0,0,0,0.26)] sm:h-[4.25rem] sm:w-[4.25rem]"
      >
        {/* WhatsApp mark (inline SVG) to avoid downloading a large PNG on mobile */}
        <svg
          viewBox="0 0 32 32"
          width="28"
          height="28"
          fill="currentColor"
          role="presentation"
          focusable="false"
        >
          <path d="M16.04 3C9.4 3 4 8.33 4 14.9c0 2.31.69 4.56 2 6.5L4.7 27.9l6.72-1.25c1.86 1 3.96 1.52 6.12 1.52 6.64 0 12.04-5.33 12.04-11.9C29.58 8.33 22.68 3 16.04 3zm6.97 16.9c-.3.83-1.78 1.58-2.45 1.67-.62.08-1.4.12-2.26-.14-.52-.16-1.19-.39-2.05-.75-3.6-1.52-5.95-5.13-6.13-5.38-.18-.25-1.46-1.94-1.46-3.7 0-1.76.93-2.62 1.25-2.98.32-.36.7-.45.93-.45.23 0 .47 0 .67.01.22.01.5-.08.78.6.3.72 1.02 2.48 1.11 2.66.09.18.15.4.03.65-.12.25-.18.4-.36.61-.18.21-.38.47-.54.63-.18.18-.37.37-.16.72.21.36.94 1.54 2.02 2.49 1.39 1.24 2.56 1.62 2.92 1.8.36.18.57.15.78-.09.21-.24.89-1.04 1.13-1.4.24-.36.48-.3.8-.18.32.12 2.04.96 2.39 1.13.35.17.58.26.67.4.09.14.09.83-.21 1.66z" />
        </svg>
      </span>
    </a>
  );
}

