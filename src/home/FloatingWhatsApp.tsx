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
      <img
        src="/whatsapp%20logo.png"
        alt=""
        width={64}
        height={64}
        decoding="async"
        className="h-[7.5rem] w-[7.5rem] object-contain drop-shadow-[0_16px_34px_rgba(0,0,0,0.26)] sm:h-[8.5rem] sm:w-[8.5rem]"
        draggable={false}
      />
    </a>
  );
}

