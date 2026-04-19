import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const PROFILE_URL = "https://www.instagram.com/vialdi_wedding/";
const EMBED_URL = "https://www.instagram.com/vialdi_wedding/embed/";

/** Jika iframe tidak memicu `load` (mis. koneksi macet), tampilkan ajakan muat ulang. */
const IFRAME_LOAD_TIMEOUT_MS = 18_000;

/**
 * Tinggi iframe per breakpoint. Embed profil IG tidak responsif: tinggi besar di layar
 * sempit membuat area putih panjang; di bawah `md` kita batasi agar kira-kira header + grid 3×2.
 */
const IFRAME_HEIGHT_MOBILE_CLASS = "h-[440px]";
const IFRAME_HEIGHT_DESKTOP_CLASS = "md:h-[1120px]";

/**
 * Feed profil Instagram (embed Meta). Mobile: lebar penuh tanpa margin negatif (grid utuh).
 * Desktop (`md+`): iframe `calc(100% + 20px)` + `-mr-5` agar area scrollbar vertikal embed
 * terpotong oleh wrapper `overflow-hidden` — scroll di dalam iframe tetap bisa (roda/trackpad).
 *
 * Tombol refresh di atas iframe: embed lintas-origin tidak bisa dideteksi error dari luar,
 * ikon tetap terlihat (termasuk saat iframe menampilkan "refused to connect") agar pengguna
 * bisa memuat ulang embed tanpa refresh seluruh halaman.
 */
export function InstagramProfileEmbed() {
  const [iframeKey, setIframeKey] = useState(0);
  const [embedSrc, setEmbedSrc] = useState(EMBED_URL);
  const [loadStalled, setLoadStalled] = useState(false);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadTimer = useCallback(() => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  const reloadEmbed = useCallback(() => {
    clearLoadTimer();
    setLoadStalled(false);
    setIframeKey((k) => k + 1);
    setEmbedSrc(`${EMBED_URL}?reload=${Date.now()}`);
  }, [clearLoadTimer]);

  useEffect(() => {
    setLoadStalled(false);
    loadTimerRef.current = setTimeout(() => {
      setLoadStalled(true);
      loadTimerRef.current = null;
    }, IFRAME_LOAD_TIMEOUT_MS);
    return () => clearLoadTimer();
  }, [iframeKey, clearLoadTimer]);

  const handleIframeLoad = useCallback(() => {
    clearLoadTimer();
    setLoadStalled(false);
  }, [clearLoadTimer]);

  return (
    <div className="mx-auto max-w-[90rem] px-4 md:px-6">
      <div className="flex flex-col items-center gap-2 text-center md:flex-row md:items-end md:justify-between md:text-left">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Ikuti kami
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-navy md:text-3xl">@vialdi_wedding</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:mx-0 md:text-base">
            Cuplikan terbaru dari dokumentasi dan suasana di balik layar — langsung dari Instagram
            kami.
          </p>
        </div>
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-navy shadow-sm transition-colors hover:border-[oklch(0.52_0.14_300)] hover:text-[oklch(0.4_0.14_305)]"
        >
          Buka di Instagram
        </a>
      </div>

      <div className="relative mt-8 isolate overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)]">
        <button
          type="button"
          onClick={reloadEmbed}
          className="absolute top-3 right-3 z-20 flex size-11 items-center justify-center rounded-full border border-border bg-card/95 text-navy shadow-md backdrop-blur-sm transition-[color,box-shadow,transform] hover:bg-card hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.52_0.14_300)] active:scale-95 md:top-4 md:right-4 md:size-12"
          aria-label="Muat ulang feed Instagram"
          title="Muat ulang feed Instagram"
        >
          <RefreshCw className="size-5 md:size-[1.35rem]" aria-hidden />
        </button>

        {loadStalled ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-card/85 px-6 text-center backdrop-blur-[2px] md:px-10"
            role="status"
            aria-live="polite"
          >
            <p className="max-w-sm text-sm font-medium text-navy md:text-base">
              Feed belum muncul atau koneksi ke Instagram terputus. Ketuk muat ulang di bawah atau
              ikon di pojok kanan atas.
            </p>
            <button
              type="button"
              onClick={reloadEmbed}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-navy shadow-sm transition-colors hover:border-[oklch(0.52_0.14_300)] hover:text-[oklch(0.4_0.14_305)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.52_0.14_300)]"
            >
              <RefreshCw className="size-4 shrink-0" aria-hidden />
              Muat ulang feed
            </button>
          </div>
        ) : null}

        <iframe
          key={iframeKey}
          src={embedSrc}
          title="Feed Instagram Vialdi Wedding"
          className={`block w-full max-w-full border-0 ${IFRAME_HEIGHT_MOBILE_CLASS} ${IFRAME_HEIGHT_DESKTOP_CLASS} md:w-[calc(100%+20px)] md:max-w-none md:-mr-5`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}
