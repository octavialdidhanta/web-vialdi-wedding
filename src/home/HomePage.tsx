import { useEffect, useLayoutEffect, useState } from "react";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { Header } from "@/share/Header";
import { Footer } from "@/share/Footer";
import { SectionTitle } from "@/home/SectionTitle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";
import { JanjiCompanionColumn } from "@/home/JanjiCompanionColumn";
import { PostPackageTrustLeadCard, PostPackageTrustSection } from "@/home/PostPackageTrustSection";
import { FeaturedLayananCards } from "@/home/FeaturedLayananCards";
import { ServiceCategoryGrid } from "@/home/ServiceCategoryGrid";
import { WeddingGuaranteeSection } from "@/home/WeddingGuaranteeSection";
import { PaketUnggulanQuickNav } from "@/home/PaketUnggulanQuickNav";
import { WeddingPackageHighlight } from "@/home/WeddingPackageHighlight";
import { InstagramProfileEmbed } from "@/home/InstagramProfileEmbed";
import { HeroAlbumKolaseVideo } from "@/home/HeroAlbumKolaseVideo";
import {
  PackageConsultOpenerProvider,
  usePackageConsultOpenerOptional,
} from "@/home/PackageConsultOpenerContext";

const HERO_IMAGE =
  "https://jasafotowedding.com/wp-content/uploads/2024/02/Screenshot-2023-08-30-171354-e1707757094943.png";

const VIEWPORT_DEFAULT = "width=device-width, initial-scale=1.0";
/** Mencegah pinch-to-zoom hanya saat Home aktif; dikembalikan saat navigasi ke halaman lain. */
const VIEWPORT_HOME_NO_PINCH =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no";

export function HomePage() {
  return (
    <PackageConsultOpenerProvider>
      <HomePageInner />
    </PackageConsultOpenerProvider>
  );
}

function HomePageInner() {
  const packageConsultOpener = usePackageConsultOpenerOptional();
  const [blockLandscapeTouch, setBlockLandscapeTouch] = useState(false);

  useLayoutEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const previous = meta?.getAttribute("content") ?? VIEWPORT_DEFAULT;
    if (meta) meta.setAttribute("content", VIEWPORT_HOME_NO_PINCH);

    let cancelled = false;
    const tryLockPortrait = () => {
      if (cancelled) return;
      const so = screen.orientation;
      if (so && typeof so.lock === "function") {
        void so.lock("portrait").catch(() => {});
      }
    };
    tryLockPortrait();
    const onFirstPointer = () => {
      tryLockPortrait();
      window.removeEventListener("pointerdown", onFirstPointer);
    };
    window.addEventListener("pointerdown", onFirstPointer, { passive: true });

    return () => {
      cancelled = true;
      if (meta) meta.setAttribute("content", previous);
      window.removeEventListener("pointerdown", onFirstPointer);
      try {
        screen.orientation?.unlock?.();
      } catch {
        /* beberapa browser tidak mengizinkan unlock di konteks ini */
      }
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (pointer: coarse)");
    const sync = () => setBlockLandscapeTouch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div className="min-h-screen touch-manipulation bg-background">
      {blockLandscapeTouch ? (
        <div
          role="alertdialog"
          aria-live="polite"
          aria-label="Mode portrait diperlukan"
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4 bg-background/97 px-6 text-center backdrop-blur-sm"
        >
          <p className="max-w-sm text-base font-semibold text-foreground">
            Silakan putar perangkat kembali ke posisi portrait.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Halaman beranda dioptimalkan untuk tampilan tegak; landscape dinonaktifkan di perangkat
            sentuh.
          </p>
        </div>
      ) : null}

      <Header />

      {/* Hero */}
      <section className="relative overflow-x-hidden border-b border-border/40 bg-background pb-10 md:pb-14 lg:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.88 0.05 300), oklch(0.94 0.02 95))",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[oklch(0.75_0.08_300)]/15 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-[90rem] items-center gap-12 px-4 pt-10 pb-10 md:px-6 md:pt-16 md:pb-12 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.55_0.16_300)]" />
              Wedding organizer &amp; dokumentasi
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-navy md:text-5xl lg:text-[3.35rem]">
              Wujudkan pernikahan impian dengan{" "}
              <span className="bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] bg-clip-text text-transparent">
                dekorasi, busana, rias
              </span>
              , dan tim foto-video profesional.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Vialdi Wedding mendampingi Anda dari konsep, persiapan, hingga kenangan yang rapi di
              album dan layar — supaya hari H terasa ringan, indah, dan berkesan.
            </p>
            <div className="mt-8">
              <a
                href="#paket-dokumentasi"
                data-track={TRACK_KEYS.contactCta}
                className="inline-flex rounded-full bg-navy px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90"
                onClick={(e) => {
                  if (packageConsultOpener) {
                    e.preventDefault();
                    packageConsultOpener.requestOpenAllPackageConsults();
                  }
                }}
              >
                Konsultasi gratis
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
              <img
                src={HERO_IMAGE}
                alt="Pasangan pengantin dalam suasana pernikahan elegan"
                width={1200}
                height={1200}
                sizes="(max-width: 1024px) 100vw, min(560px, 46vw)"
                fetchPriority="high"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
              <p className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/45 px-2 py-1 text-[0.65rem] font-medium leading-none tracking-wide text-white/95 backdrop-blur-[2px] sm:bottom-3 sm:right-3 sm:text-[0.7rem]">
                Photo by Vialdi Wedding
              </p>
            </div>
            <div className="absolute -left-4 top-8 hidden rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm md:block">
              <p className="max-w-[11rem] text-xs font-medium leading-snug text-navy">
                Paket foto &amp; video + album — ringkas dalam satu penawaran.
              </p>
            </div>
            <div className="absolute -right-4 bottom-8 hidden rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm md:block">
              <p className="max-w-[10rem] text-xs text-muted-foreground">
                Tim berpengalaman untuk hotel &amp; gedung.
              </p>
            </div>
          </div>
        </div>

        <HeroAlbumKolaseVideo />
      </section>

      {/* Mobile: kategori → layanan → paket → kartu "solusinya" → janji + before/after → kutipan dokumentasi → sisa narasi post-paket → Instagram. Md+: kutipan tetap sebelum blok janji seperti desktop. */}
      <div className="flex flex-col">
        {/* Kategori layanan */}
        <section className="order-1 bg-card py-10 md:py-14">
          <ServiceCategoryGrid />
        </section>

        {/* Kartu layanan unggulan */}
        <section className="order-2 border-y border-border/60 bg-secondary/50 pt-8 pb-14 md:pt-10 md:pb-20">
          <FeaturedLayananCards />
        </section>

        {/* Paket unggulan — kartu pembuka narasi di mobile tepat di bawah carousel; lanjutan narasi setelah janji (md:hidden). */}
        <section
          id="paket-dokumentasi"
          className="order-3 scroll-mt-24 border-t-0 bg-secondary/30 pt-8 pb-8 md:order-5 md:border-t md:border-border/60 md:pt-10 md:pb-10"
        >
          <div className="mx-auto max-w-[90rem] px-4 pb-5 md:px-6 md:pb-6">
            <SectionTitle
              className="text-left"
              align="left"
              title="Paket unggulan"
              subtitle="Pilihan paket foto &amp; video + album, termasuk opsi foto only — detail final mengikuti tanggal, lokasi, dan add-on yang Anda pilih."
              belowTitle={<PaketUnggulanQuickNav />}
            />
          </div>
          <WeddingPackageHighlight />
          <div className="mx-auto max-w-[90rem] px-4 pt-6 pb-0 md:hidden">
            <PostPackageTrustLeadCard />
          </div>
          <div className="mx-auto hidden max-w-[90rem] border-t border-border/50 px-4 pt-8 md:mt-10 md:block md:px-6 md:pt-10">
            <PostPackageTrustSection />
          </div>
        </section>

        {/* Kutipan dokumentasi — mobile: setelah before/after; md+: sebelum blok janji */}
        <section className="order-5 bg-background py-14 md:order-3 md:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
            <p className="font-wedding-serif text-xl font-bold leading-snug text-navy md:text-2xl lg:text-[1.65rem]">
              Dokumentasi jernih, komunikasi transparan, dan tim yang paham ritme hari H — dari rumah
              sederhana hingga venue hotel &amp; gedung.
            </p>
          </div>
        </section>

        {/* Janji & garansi + Before/After (kanan) */}
        <section className="order-4 bg-secondary/40 pt-12 pb-8 md:order-4 md:pt-16 md:pb-10">
          <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-14 px-4 md:px-6 md:gap-16 lg:grid-cols-2 lg:items-start lg:gap-x-32 lg:gap-y-0 xl:gap-x-40 2xl:gap-x-48">
            <WeddingGuaranteeSection />
            <JanjiCompanionColumn />
          </div>
        </section>

        {/* Narasi post-paket (tanpa kartu pembuka di mobile — kartu itu sudah di atas): di mobile setelah janji + before/after; di desktop sisi atas tetap di dalam blok paket. */}
        <section className="order-6 border-t border-border/50 bg-secondary/30 pt-8 pb-8 md:hidden">
          <div className="mx-auto max-w-[90rem] px-4 md:px-6">
            <PostPackageTrustSection />
          </div>
        </section>

        {/* Instagram */}
        <section className="order-7 border-t border-border/60 bg-background py-10 md:order-6 md:py-14">
          <InstagramProfileEmbed />
        </section>
      </div>

      {/* CTA */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 text-center md:px-6 md:pt-12 md:pb-20 md:text-left">
          <SectionTitle
            title="Mulai dari obrolan singkat"
            subtitle="Ceritakan tanggal, venue, dan impian Anda. Kami bantu susun paket yang masuk akal dan menyenangkan."
          />
          <div className="mt-10 flex justify-start">
            <a
              href="#paket-dokumentasi"
              data-track={TRACK_KEYS.contactCta}
              className="rounded-full bg-navy px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90"
              onClick={(e) => {
                if (packageConsultOpener) {
                  e.preventDefault();
                  packageConsultOpener.requestOpenAllPackageConsults();
                }
              }}
            >
              Hubungi kami
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background">
        <div className="mx-auto max-w-[90rem] px-4 md:px-6 pb-20">
          <div className="mx-auto w-full max-w-5xl rounded-3xl border border-border bg-card px-3 py-6 shadow-sm md:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">FAQ</h2>
              <p className="mt-3 text-muted-foreground">
                Pertanyaan yang sering ditanyakan sebelum memesan layanan wedding organizer &
                dokumentasi.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-4xl">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Apa saja yang dicakup oleh Vialdi Wedding?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Kami menyediakan dokumentasi foto &amp; video (termasuk paket dengan album),
                    kolaborasi dengan vendor rias dan busana, serta pendampingan dekorasi pelaminan
                    sesuai paket yang dipilih.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Bagaimana cara memilih paket yang tepat?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Setelah konsultasi gratis, kami merekomendasikan durasi tim, jumlah fotografer /
                    videografer, dan add-on berdasarkan skala acara (rumah, outdoor, hotel, atau
                    gedung).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Kapan hasil foto dan video biasanya selesai?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Waktu penyelesaian bervariasi per paket. Untuk paket prioritas, estimasi hasil
                    foto utama dapat lebih cepat — detail tertuang di proposal resmi.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Apakah revisi editing dimungkinkan?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Ya, dalam batas wajar dan sesuai kesepakatan di kontrak. Tujuan kami adalah hasil
                    yang Anda banggakan tanpa mengorbankan kualitas artistik.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Apakah melayani luar kota?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Silakan sampaikan kota dan venue pada formulir kontak. Biaya transport &
                    akomodasi tim (jika diperlukan) akan dijelaskan secara transparan.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
