import { useState } from "react";
import { Play } from "lucide-react";
import posterMAo from "./assets/youtube/mAoEjRTJKC4-hqdefault.jpg";
import posterK9 from "./assets/youtube/K9anWRATqdo-hqdefault.jpg";

/** Privacy Enhanced embed — host `youtube-nocookie.com`. */
function embedSrc(videoId: string) {
  const q = new URLSearchParams({
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    autoplay: "1",
    mute: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${q.toString()}`;
}

/** Poster di-host sendiri (cache panjang dari origin Anda), bukan `i.ytimg.com` (TTL pendek di PSI). */
const LOCAL_POSTERS: Record<string, string> = {
  mAoEjRTJKC4: posterMAo,
  K9anWRATqdo: posterK9,
};

function localPosterSrc(videoId: string): string {
  const src = LOCAL_POSTERS[videoId];
  if (!src) {
    throw new Error(`Tambahkan poster lokal di assets/youtube untuk videoId=${videoId}`);
  }
  return src;
}

type SlotProps = {
  videoId: string;
  iframeTitle: string;
  placeholder: string;
  className?: string;
};

/**
 * Facade + ketuk-putar: iframe YouTube tidak dimuat sebelum gestur pengguna,
 * sehingga kuki / isu lintas-situs di Chrome Issues (dan lab Lighthouse) tidak
 * muncul hanya karena scroll. Setelah aktif, autoplay bisu seperti embed biasa.
 */
function AutoplayYoutubeSlot({ videoId, iframeTitle, placeholder, className }: SlotProps) {
  const [active, setActive] = useState(false);

  return (
    <div className={`aspect-video w-full overflow-hidden bg-black ${className ?? ""}`}>
      {active ? (
        <iframe
          src={embedSrc(videoId)}
          title={iframeTitle}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          credentialless=""
        />
      ) : (
        <div className="relative h-full w-full">
          <img
            src={localPosterSrc(videoId)}
            alt=""
            width={480}
            height={360}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 px-4 text-center">
            <button
              type="button"
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/95 text-navy shadow-lg ring-2 ring-white/40 transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 motion-reduce:transition-none"
              aria-label={`Putar video: ${iframeTitle}`}
              onClick={() => setActive(true)}
            >
              <Play className="ml-0.5 h-7 w-7 fill-current" aria-hidden />
            </button>
            <p className="max-w-sm text-xs font-medium leading-snug text-white/95 sm:text-sm">
              {placeholder}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Di bawah baris hero: mobile bertumpuk, desktop (`lg+`) dua video berdampingan.
 */
export function HeroAlbumKolaseVideo() {
  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] mt-8 w-screen max-w-[100vw] sm:mt-10 lg:relative lg:left-auto lg:right-auto lg:mx-auto lg:mt-10 lg:w-full lg:max-w-[90rem]">
      <div className="flex flex-col gap-6 px-2.5 pb-2 md:px-6 lg:flex-row lg:gap-8 lg:pb-0">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-center text-sm font-semibold leading-snug text-navy lg:mb-3 lg:text-left">
            Contoh album kolase yang akan diterima klien
          </p>
          <AutoplayYoutubeSlot
            videoId="mAoEjRTJKC4"
            iframeTitle="Contoh album kolase untuk klien Vialdi Wedding"
            placeholder="Ketuk tombol putar untuk menonton cuplikan album (memuat pemutar YouTube)."
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-center text-sm font-semibold leading-snug text-navy lg:mb-3 lg:text-left">
            Cuplikan tambahan
          </p>
          <AutoplayYoutubeSlot
            videoId="K9anWRATqdo"
            iframeTitle="Cuplikan video album Vialdi Wedding"
            placeholder="Ketuk putar untuk cuplikan berikutnya (memuat pemutar YouTube)."
          />
        </div>
      </div>
    </div>
  );
}
