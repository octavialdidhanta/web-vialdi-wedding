import garansiSealImage from "@/1-home/assets/Untitled design (4).png";
import { TRACK_KEYS } from "@/analytics/trackRegistry";

export function WeddingGaransiMobileSection({
  onCtaClick,
}: {
  onCtaClick: (ev: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <section id="home-garansi" className="scroll-mt-24 bg-background pt-2 pb-2 md:hidden">
      <div className="mx-auto max-w-[90rem] px-2.5">
        <div className="flex flex-col rounded-2xl border border-border bg-card px-4 py-6 text-center shadow-md">
          <img
            src={garansiSealImage}
            alt="Garansi 100% uang kembali"
            width={320}
            height={320}
            loading="lazy"
            decoding="async"
            className="mx-auto h-auto w-40 max-w-full object-contain"
          />
          <h3 className="mt-6 text-lg font-bold text-navy">Garansi kepuasan &amp; transparansi</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Tenang — semuanya jelas dari awal. Jika hasil tidak sesuai kesepakatan tertulis (deliverable &amp; standar
            yang disetujui), kami siapkan solusi yang adil sesuai kontrak — termasuk opsi pengembalian dana. Kami jaga
            kepercayaan Anda, karena hari H tidak bisa diulang.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Detail garansi, deliverable, dan syarat pembatalan tercantum di proposal &amp; kontrak resmi.
          </p>
          <div className="mt-6">
            <a
              href="#paket-dokumentasi"
              data-track={TRACK_KEYS.contactCta}
              className="inline-flex rounded-full bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.48_0.2_300)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={onCtaClick}
            >
              Amankan slot konsultasi
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

