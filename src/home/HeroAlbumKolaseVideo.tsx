import { useEffect, useRef, useState } from "react";

function embedSrc(videoId: string) {
  const q = new URLSearchParams({
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    autoplay: "1",
    mute: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${q.toString()}`;
}

type SlotProps = {
  videoId: string;
  iframeTitle: string;
  placeholder: string;
  className?: string;
};

/**
 * Satu embed YouTube: autoplay (muted) saat area video terlihat di viewport;
 * iframe dilepas saat keluar viewport agar pemutaran berhenti.
 */
function AutoplayYoutubeSlot({ videoId, iframeTitle, placeholder, className }: SlotProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setPlaying(entry.isIntersecting);
      },
      { threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1], rootMargin: "0px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`aspect-video w-full bg-black ${className ?? ""}`}>
      {playing ? (
        <iframe
          src={embedSrc(videoId)}
          title={iframeTitle}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-center text-xs text-muted-foreground">
          {placeholder}
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
      <div className="flex flex-col gap-6 px-4 pb-2 md:px-6 lg:flex-row lg:gap-8 lg:pb-0">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-center text-sm font-semibold leading-snug text-navy lg:mb-3 lg:text-left">
            Contoh album kolase yang akan diterima klien
          </p>
          <AutoplayYoutubeSlot
            videoId="mAoEjRTJKC4"
            iframeTitle="Contoh album kolase untuk klien Vialdi Wedding"
            placeholder="Gulir ke sini untuk melihat cuplikan album"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-center text-sm font-semibold leading-snug text-navy lg:mb-3 lg:text-left">
            Cuplikan tambahan
          </p>
          <AutoplayYoutubeSlot
            videoId="K9anWRATqdo"
            iframeTitle="Cuplikan video album Vialdi Wedding"
            placeholder="Gulir untuk melihat cuplikan berikutnya"
          />
        </div>
      </div>
    </div>
  );
}
