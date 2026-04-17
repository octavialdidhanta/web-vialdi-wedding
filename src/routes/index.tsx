import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { TimelineCarousel } from "@/components/TimelineCarousel";
import { SectionTitle } from "@/components/SectionTitle";
import leadAcq from "@/assets/lead-acquisition.jpg";
import konvensional from "@/assets/konvensional.jpg";
import waktu from "@/assets/waktu-tenaga.jpg";
import biaya from "@/assets/biaya.jpg";
import ecommerce from "@/assets/ecommerce.jpg";
import automotive from "@/assets/automotive.jpg";
import mobileapp from "@/assets/mobileapp.jpg";
import newfemme from "@/assets/newfemme.jpg";
import retail from "@/assets/retail.jpg";
import founder from "@/assets/founder.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "vialdi.id — Tingkatkan Penjualan dengan Project Management" },
      {
        name: "description",
        content:
          "vialdi.id membantu perusahaan memaksimalkan project management, akuisisi lead, dan prospek digital untuk mendorong penjualan.",
      },
      { property: "og:title", content: "vialdi.id — Digital Marketing & Lead Generation" },
      {
        property: "og:description",
        content: "Strategi penjualan yang lebih efektif dan efisien untuk bisnis Anda.",
      },
    ],
  }),
  component: HomePage,
});

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

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-8 h-1 w-16 rounded-full bg-accent-orange" />
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-navy md:text-5xl lg:text-6xl">
            Tingkatkan penjualan Anda dengan{" "}
            <span className="text-primary">project management</span> kami yang baik, optimalisasi
            prospek dan lead digital
          </h1>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90"
            >
              Saya Ingin Konsultasi
            </Link>
            <Link
              to="/service"
              className="rounded-full border border-border bg-background px-8 py-3 text-sm font-semibold text-navy transition-colors hover:bg-secondary"
            >
              Lihat Layanan
            </Link>
          </div>
        </div>
      </section>

      {/* Layanan Kami (gradient ungu) */}
      <section className="text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Layanan Kami:</h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-primary-foreground/85">
              vialdi.id hadir untuk membantu perusahaan Anda dalam memaksimalkan project
              management, akuisisi lead dan prospek dalam mendorong peningkatan penjualan Anda!
            </p>
          </div>
          <ul className="space-y-4">
            {services.map((s) => (
              <li
                key={s.tag}
                className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <span className="rounded-md bg-accent-orange px-3 py-1 text-sm font-semibold text-navy">
                  {s.tag}
                </span>
                <span className="text-sm font-medium">✓ Yes</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Two columns inside same gradient */}
        <div className="border-t border-white/10">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2">
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
              <div key={c.title} className="text-center">
                <h3 className="text-xl font-bold">{c.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem timeline */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionTitle
            title="Jalankan strategi penjualan yang lebih efektif dan efisien"
            subtitle="Banyak perusahaan yang menemukan berbagai masalah dalam proses penjualannya, misalnya saja:"
          />
          <div className="mt-12">
            <TimelineCarousel items={problems} />
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
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionTitle title="Kami memiliki pengalaman dalam membantu berbagai industri" />
          <div className="mt-12">
            <TimelineCarousel items={industries} />
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
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90"
            >
              👉 Saya Ingin Konsultasi
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <h4 className="text-lg font-bold">PT. Integrasi Visual Digital Indonesia</h4>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85">
              Jl. Tawakal VI A No.104, RT.5/RW.9, Tomang, Kec. Grogol petamburan, Kota Jakarta
              Barat, DKI Jakarta 11440
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold">Subscribe Now</h4>
            <p className="mt-4 text-sm text-primary-foreground/85">
              Don't miss our future updates! Get Subscribed Today!
            </p>
            <form className="mt-4 flex overflow-hidden rounded-full bg-white p-1">
              <input
                type="email"
                placeholder="Your mail here"
                className="flex-1 bg-transparent px-4 py-2 text-sm text-navy outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                ✉
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-primary-foreground/70">
            ©2025 All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
