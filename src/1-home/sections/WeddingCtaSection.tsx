import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { SectionTitle } from "@/1-home/components/SectionTitle";

export function WeddingCtaSection({
  onCtaClick,
}: {
  onCtaClick: (ev: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <section id="home-chat" className="scroll-mt-24 bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 text-center md:px-6 md:pt-12 md:pb-20 md:text-left">
        <SectionTitle
          title="Mulai dari obrolan singkat"
          subtitle="Ceritakan tanggal, venue, dan impian Anda. Kami bantu susun paket yang masuk akal dan menyenangkan."
        />
        <div className="mt-10 flex justify-start">
          <a
            href="#paket-dokumentasi"
            data-track={TRACK_KEYS.homeCtaSectionCta}
            className="rounded-full bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] px-8 py-3 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.48_0.2_300)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={onCtaClick}
          >
            Hubungi kami
          </a>
        </div>
      </div>
    </section>
  );
}

