import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { Header } from "@/share/Header";
import { Footer } from "@/share/Footer";
import { DeferUntilVisible } from "@/share/DeferUntilVisible";
import { SectionTitle } from "@/home/SectionTitle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/share/ui/accordion";
import leadAcq from "@/home/assets/lead-acquisition.jpg";
import konvensional from "@/home/assets/konvensional.jpg";
import waktu from "@/home/assets/waktu-tenaga.jpg";
import biaya from "@/home/assets/biaya.jpg";
import ecommerce from "@/home/assets/ecommerce.jpg";
import automotive from "@/home/assets/automotive.jpg";
import mobileapp from "@/home/assets/mobileapp.jpg";
import newfemme from "@/home/assets/newfemme.jpg";
import retail from "@/home/assets/retail.jpg";
import founder from "@/home/assets/founder.jpg";
import hero from "@/home/assets/hero.jpg";

const TimelineCarousel = lazy(() =>
  import("@/home/TimelineCarousel").then((m) => ({ default: m.TimelineCarousel })),
);

function CarouselFallback() {
  return (
    <div
      className="min-h-[22rem] rounded-2xl border border-border/60 bg-muted/20"
      aria-hidden
    />
  );
}

const services = [
  { tag: "Lead Acquisition" },
  { tag: "Lead Activation" },
  { tag: "Digital Presence" },
  { tag: "Digital Optimization" },
];

const problems = [
  {
    title: "Lead Acquisition",
    image: leadAcq,
    caption: "Akuisisi lead dan prospek untuk sales tidak stabil.",
  },
  {
    title: "Konvensional",
    image: konvensional,
    caption:
      "Akusisi lead dan prospek sangat mengandalkan strategi offline seperti pameran dan lainnya.",
  },
  {
    title: "Waktu & Tenaga",
    image: waktu,
    caption: "Waktu yang harus dikeluarkan tidak tentu untuk mendapatkan lead dan prospek.",
  },
  {
    title: "Biaya",
    image: biaya,
    caption: "Biaya yang harus dikeluarkan untuk mendapatkan 1 buah prospek cukup besar.",
  },
];

const industries = [
  {
    title: "PT. AMG",
    subtitle: "Advertising",
    image: leadAcq,
    caption:
      "Kami membantu meningkatkan peringkat kepuasan Pelanggan sebanyak 70%, dari content video yang kami produksi.",
  },
  {
    title: "PT IMA",
    subtitle: "E-Commerce & Retail",
    image: ecommerce,
    caption:
      "Kami membantu meningkatkan penjualan E-Commerce dari 20% naik menjadi 70% di quarter ke dua.",
  },
  {
    title: "PT Jilbert Kreasindo",
    subtitle: "Automotive Service",
    image: automotive,
    caption:
      "Kami berhasil meningkatkan Leads Acquisition sebanyak 30% dari Optimasi Conversion Rate di website.",
  },
  {
    title: "PT Cashtree",
    subtitle: "Advertising & Mobile App",
    image: mobileapp,
    caption:
      "Kami berhasil membantu meningkatkan jumlah install Cashtree Mobile App kurang lebih 2 juta install, total install kini mencapai 10 juta.",
  },
  {
    title: "PT Newfemme",
    subtitle: "Advertising & Mobile App",
    image: newfemme,
    caption:
      "Kami berhasil membantu meningkatkan jumlah install Newfemme Mobile App kurang lebih 500.000 install di 3 bulan pertama.",
  },
  {
    title: "PT Lumen Indonesia",
    subtitle: "Retail",
    image: retail,
    caption:
      "Kami berhasil membangun Perusahaan From Zero To Hero, dan berhasil menghasilkan penjualan.",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-orange/15 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-[90rem] items-center gap-12 px-6 py-10 md:py-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent-orange" />
              Digital Growth Partner
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-navy md:text-5xl lg:text-6xl">
              Tingkatkan penjualan Anda dengan{" "}
              <span className="inline-block">
                <span className="text-accent-orange">optimalisasi</span>{" "}
                <span className="text-accent-orange">lead digital</span>
              </span>{" "}
              - & project management yang baik.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Solusi end-to-end untuk akuisisi lead, aktivasi prospek, dan optimasi penjualan
              digital — terbukti membantu puluhan brand bertumbuh.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/contact"
                data-track={TRACK_KEYS.contactCta}
                className="rounded-full bg-navy px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:bg-accent-orange hover:shadow-lg"
              >
                Saya Ingin Konsultasi
              </Link>
              <Link
                to="/service"
                className="rounded-full border border-border bg-card px-8 py-3.5 text-sm font-semibold text-navy transition-colors hover:border-accent-orange hover:text-accent-orange"
              >
                Lihat Layanan →
              </Link>
            </div>
            <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                { value: "70%", label: "Peningkatan penjualan" },
                { value: "10M+", label: "App installs" },
                { value: "50+", label: "Brand partner" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-navy md:text-3xl">{s.value}</div>
                  <div className="mt-1 text-xs leading-tight text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
              <img
                src={hero}
                alt="Tim digital marketing menganalisis dashboard"
                width={1024}
                height={1024}
                sizes="(max-width: 1024px) 100vw, min(560px, 46vw)"
                fetchPriority="high"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="absolute -left-4 top-8 hidden rounded-2xl border border-border bg-card p-4 shadow-lg md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-orange/15 text-lg">
                  📈
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Lead Growth</div>
                  <div className="text-sm font-bold text-navy">+248%</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 bottom-8 hidden rounded-2xl border border-border bg-card p-4 shadow-lg md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-primary-foreground">
                  ✓
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Conversion Rate</div>
                  <div className="text-sm font-bold text-navy">Optimized</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layanan Kami */}
      <section className="bg-secondary">
        <div className="mx-auto grid max-w-[90rem] gap-12 px-6 pt-20 pb-6 md:grid-cols-2 md:pb-8">
          <div>
            <h2 className="text-3xl font-bold text-navy md:text-4xl">Layanan Kami</h2>
            <div className="mt-3 h-1 w-16 rounded-full bg-accent-orange" />
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              vialdi.id hadir untuk membantu perusahaan Anda dalam memaksimalkan project management,
              akuisisi lead dan prospek dalam mendorong peningkatan penjualan Anda!
            </p>
          </div>
          <ul className="space-y-3">
            {services.map((s) => (
              <li
                key={s.tag}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
              >
                <span className="rounded-md bg-accent-orange/15 px-3 py-1 text-sm font-semibold text-accent-orange">
                  {s.tag}
                </span>
                <span className="text-sm font-medium text-navy">✓ Yes</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto max-w-[90rem] px-6 pt-4 pb-12 md:pt-5 md:pb-14">
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {[
                {
                  title: "Digital Marketing",
                  desc: "Membantu perusahaan untuk mencapai tujuan & target penjualan dengan membawa traffic ke bisnis Anda.",
                },
                {
                  title: "Creative & Copy Writing",
                  desc: "Membuat orang mengambil tindakan untuk menggunakan produk atau layanan dengan strategi visual & copywriting yang persuasif.",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
                >
                  <h3 className="text-xl font-bold tracking-tight text-navy md:text-2xl">
                    {c.title}
                  </h3>
                  <div className="mt-3 h-1 w-12 rounded-full bg-accent-orange" />
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {c.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem timeline */}
      <section className="bg-background">
        <div className="mx-auto max-w-[90rem] px-6 py-20">
          <SectionTitle
            title="Jalankan strategi penjualan yang lebih efektif dan efisien"
            subtitle="Banyak perusahaan yang menemukan berbagai masalah dalam proses penjualannya, misalnya saja:"
          />
          <div className="mt-12">
            <DeferUntilVisible>
              <Suspense fallback={<CarouselFallback />}>
                <TimelineCarousel items={problems} />
              </Suspense>
            </DeferUntilVisible>
          </div>
        </div>
      </section>

      {/* Founder quote */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-lg italic leading-relaxed text-muted-foreground md:text-xl">
            "To avoid trial and error in your business, consider utilizing our services to increase
            your business revenue. Remember, investing your time wisely is crucial, as time is
            money."
          </p>
          <div className="mt-10 flex flex-col items-center">
            <div className="rounded-full border-2 border-accent-orange p-1">
              <img
                src={founder}
                alt="Octa Vialdi, Founder & CEO"
                loading="lazy"
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
              />
            </div>
            <p className="mt-4 text-base font-bold text-navy">Octa Vialdi</p>
            <p className="text-sm text-muted-foreground">Founder / Chief Executive Officer</p>
          </div>
        </div>
      </section>

      {/* Industries timeline */}
      <section className="bg-background">
        <div className="mx-auto max-w-[90rem] px-6 py-20">
          <SectionTitle title="Kami memiliki pengalaman dalam membantu berbagai industri" />
          <div className="mt-12">
            <DeferUntilVisible>
              <Suspense fallback={<CarouselFallback />}>
                <TimelineCarousel items={industries} />
              </Suspense>
            </DeferUntilVisible>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 pb-20 text-center md:text-left">
          <SectionTitle
            title="Digital Marketing Dengan Orientasi Pertumbuhan Bisnis"
            subtitle="Digital Marketing yang tepat guna lebih dari sekedar memiliki media sosial yang artistik atau website yang canggih."
          />
          <p className="mt-6 max-w-3xl text-base text-muted-foreground md:text-lg">
            Digital Marketing harus dijalankan dengan tepat guna dan terukur agar dapat mendorong
            pertumbuhan bisnis organisasi Anda.
          </p>
          <div className="mt-10 flex justify-center md:justify-start">
            <Link
              to="/contact"
              data-track={TRACK_KEYS.contactCta}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90"
            >
              👉 Saya Ingin Konsultasi
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background">
        <div className="mx-auto max-w-[90rem] px-6 pb-20">
          <div className="mx-auto w-full max-w-5xl rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">FAQ</h2>
              <p className="mt-3 text-muted-foreground">
                Beberapa pertanyaan yang paling sering ditanyakan sebelum mulai kerja sama.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-4xl">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Apa yang dimaksud layanan vialdi.id?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    vialdi.id adalah Digital Growth Partner yang membantu bisnis meningkatkan
                    penjualan melalui strategi dan eksekusi end-to-end: lead acquisition, lead
                    activation, digital presence, dan digital optimization.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    Masalah bisnis apa yang paling sering kami bantu selesaikan?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Umumnya: lead tidak stabil, biaya akuisisi tinggi, conversion rate rendah,
                    tracking berantakan, dan follow-up sales tidak konsisten. Kami bantu rapikan
                    funnel agar traffic yang masuk jadi peluang dan penjualan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Layanan apa saja yang tersedia?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Kami fokus pada 4 pilar: Lead Acquisition, Lead Activation, Digital Presence,
                    dan Digital Optimization. Ruang lingkup detail akan disesuaikan dengan kebutuhan
                    bisnis dan target yang ingin dicapai.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Bagaimana cara kerja dan alur kolaborasinya?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Dimulai dari sesi discovery, lalu audit funnel & aset digital. Setelah itu kami
                    susun rencana eksekusi (prioritas, timeline, KPI), jalankan campaign/optimasi,
                    dan lakukan review rutin untuk iterasi berbasis data.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Berapa lama biasanya terlihat hasil?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Tergantung kondisi awal dan kesiapan aset. Biasanya perbaikan awal terlihat
                    dalam 2–4 minggu (tracking, materi, dan offer). Stabilitas lead dan efisiensi
                    biaya umumnya butuh 1–3 bulan iterasi.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>Apa yang perlu disiapkan sebelum mulai?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Info produk, pricing, target pasar, materi yang sudah ada (jika ada), serta
                    akses akun iklan/analytics dan website. Jika belum rapi, tidak masalah—kami
                    bantu rapikan bertahap.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>Apakah biaya iklan (ad spend) termasuk?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Umumnya tidak. Fee layanan terpisah dari ad spend dan biaya tool pihak ketiga.
                    Kami bantu mengatur alokasi budget dan optimasi performanya sesuai target yang
                    disepakati.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger>Apakah ada kontrak dan laporan rutin?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Ya. Scope kerja dan timeline dituangkan dalam dokumen kesepakatan. Selama
                    berjalan, ada update dan review rutin agar progres, temuan, dan langkah optimasi
                    selalu jelas.
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
