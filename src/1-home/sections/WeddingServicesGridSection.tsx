import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Brush, Camera, FilePenLine, Images, Mic2, Sparkles, UtensilsCrossed } from "lucide-react";
import { SectionTitle } from "@/1-home/components/SectionTitle";
import { cn } from "@/share/lib/utils";

const iconClass =
  "h-7 w-7 shrink-0 text-[var(--package-purple-solid)] md:h-9 md:w-9";

const SERVICES: { title: string; shortTitle: string; body: string; Icon: LucideIcon }[] = [
  {
    title: "Dokumentasi foto & video",
    shortTitle: "Foto & video",
    body: "Tim sinematik yang memahami alur adat maupun internasional—dari persiapan, ceremony, hingga resepsi—agar momen Anda terabadikan rapi dan emosional.",
    Icon: Camera,
  },
  {
    title: "Dekorasi & tata cahaya",
    shortTitle: "Dekorasi",
    body: "Konsep pelaminan, bunga, properti, dan lighting yang selaras tema—dirancang fotogenik dan nyaman untuk tamu di hotel maupun outdoor.",
    Icon: Sparkles,
  },
  {
    title: "Rias & busana pengantin",
    shortTitle: "Rias & busana",
    body: "Makeup tahan lama, penyesuaian tone kulit, serta kurasi gaun/jas atau kebaya agar penampilan konsisten dari sesi foto hingga malam hari.",
    Icon: Brush,
  },
  {
    title: "Sesi prewedding & love story",
    shortTitle: "Prewedding",
    body: "Konsep foto couple di studio, hotel, atau outdoor—styling ringan, arahan pose natural, dan editing selaras tema besar hari pernikahan Anda.",
    Icon: Images,
  },
  {
    title: "MC & hiburan",
    shortTitle: "MC & musik",
    body: "Rekomendasi MC profesional dan paket musik/hiburan yang selaras suasana—dari intimate dinner hingga resepsi besar.",
    Icon: Mic2,
  },
  {
    title: "Undangan & identitas acara",
    shortTitle: "Undangan",
    body: "Desain undangan cetak atau digital, RSVP, dan elemen grafis yang menyatu dengan tema dekor agar branding pernikahan Anda konsisten.",
    Icon: FilePenLine,
  },
  {
    title: "Katering & konsumsi",
    shortTitle: "Katering",
    body: "Kurasi menu atau partner F&B terpercaya—presentasi rapi, porsi jelas, dan opsi dietary yang bisa disesuaikan venue.",
    Icon: UtensilsCrossed,
  },
  {
    title: "Album foto & cetak premium",
    shortTitle: "Album",
    body: "Kurasi layout album layflat, cover material premium, dan cetak warna konsisten—didesain agar cerita hari H terasa lengkap di genggaman.",
    Icon: BookOpen,
  },
];

function ServiceCard({
  title,
  shortTitle,
  body,
  Icon,
}: {
  title: string;
  shortTitle: string;
  body: string;
  Icon: LucideIcon;
}) {
  const [bounce, setBounce] = useState(false);

  function triggerBounce() {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    setBounce(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBounce(true));
    });
  }

  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full flex-col items-center text-center",
        "cursor-pointer select-none rounded-xl px-0.5 py-1 outline-none transition-transform md:px-1 md:py-1.5",
        "focus-visible:ring-2 focus-visible:ring-[oklch(0.48_0.2_300)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        bounce && "wedding-service-bounce-anim",
      )}
      style={{ WebkitTapHighlightColor: "transparent" }}
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={triggerBounce}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerBounce();
        }
      }}
      onAnimationEnd={() => setBounce(false)}
    >
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-border/40",
          "md:h-[4.5rem] md:w-[4.5rem] md:rounded-2xl",
        )}
      >
        <Icon className={iconClass} aria-hidden strokeWidth={1.65} />
      </div>
      <h3 className="mt-1.5 w-full min-w-0 px-0.5 text-[0.625rem] font-semibold leading-tight text-navy md:mt-4 md:px-0 md:text-base md:font-bold md:leading-snug lg:text-lg">
        <span className="line-clamp-2 md:hidden">{shortTitle}</span>
        <span className="hidden md:inline">{title}</span>
      </h3>
      <p className="mt-2 hidden max-w-xs text-sm leading-relaxed text-muted-foreground md:block md:max-w-none">
        {body}
      </p>
    </div>
  );
}

/** Grid layanan Vialdi Wedding — di bawah hero, ikon aksen ungu brand. */
export function WeddingServicesGridSection() {
  return (
    <section
      id="layanan-kami"
      className="scroll-mt-24 border-t border-border/50 bg-background py-12 md:py-16 lg:py-20"
      aria-label="Layanan Vialdi Wedding"
    >
      <div className="mx-auto max-w-[90rem] px-4 md:px-6">
        <SectionTitle
          align="center"
          title="Layanan Kami"
          subtitle="Paket fleksibel dengan tim yang selaras visi dan budget pernikahan Anda."
        />
        <div className="mt-10 grid grid-cols-4 justify-items-stretch gap-x-1 gap-y-5 md:mt-12 md:grid-cols-2 md:justify-items-center md:gap-x-8 md:gap-y-12 lg:mt-16 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
          {SERVICES.map((s) => (
            <ServiceCard key={s.title} title={s.title} shortTitle={s.shortTitle} body={s.body} Icon={s.Icon} />
          ))}
        </div>
      </div>
    </section>
  );
}
