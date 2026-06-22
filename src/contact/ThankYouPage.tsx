import { useEffect, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { pushGtmThankYouPageView } from "@/analytics/gtmDataLayer";
import { metaPixelTrack, trackMetaStandardEvent } from "@/analytics/metaPixel";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { trackSynAttrs } from "@/analytics/trackSynAttributes";
import { Header } from "@/share/Header";

export function ThankYouPage() {
  const location = useLocation();
  const whatsappSent =
    (location.state as { whatsappStatus?: string } | null)?.whatsappStatus === "sent";

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    pushGtmThankYouPageView();
    // Primary conversion for Meta retargeting/optimization.
    trackMetaStandardEvent("Lead", { content_name: "thank-you-page" });
  }, []);

  useEffect(() => {
    try {
      const key = "__meta_complete_registration_fired";
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) {
        return;
      }
      metaPixelTrack("CompleteRegistration");
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(key, String(Date.now()));
      }
    } catch {
      metaPixelTrack("CompleteRegistration");
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-background">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col justify-center px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-orange/15 text-accent-orange">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Terima kasih!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            Data kamu sudah kami terima. Tim kami akan menghubungi kamu secepatnya untuk diskusi
            singkat dan langkah berikutnya.
            {whatsappSent ? (
              <>
                {" "}
                Konfirmasi juga sudah kami kirim ke WhatsApp kamu — silakan cek pesan masuk.
              </>
            ) : null}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              {...trackSynAttrs(TRACK_KEYS.thankYouBackHomeCta, { "data-syn-label": "Kembali ke Home" })}
              data-track-target="/"
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90"
            >
              Kembali ke Home
            </Link>
            <Link
              to="/service"
              {...trackSynAttrs(TRACK_KEYS.thankYouViewServiceCta, { "data-syn-label": "Lihat Service" })}
              data-track-target="/service"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-8 py-3 text-sm font-semibold text-navy transition-colors hover:border-accent-orange hover:text-accent-orange"
            >
              Lihat Service
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
