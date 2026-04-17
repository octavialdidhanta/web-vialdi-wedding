import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";

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
  { tag: "Lead Acquisition", desc: "Akuisisi lead berkualitas untuk pipeline penjualan stabil." },
  { tag: "Lead Activation", desc: "Aktivasi prospek menjadi pelanggan setia." },
  { tag: "Digital Presence", desc: "Bangun kehadiran digital yang kuat dan dipercaya." },
  { tag: "Digital Optimization", desc: "Optimalkan setiap channel untuk hasil maksimal." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-8 h-3 w-full bg-[repeating-linear-gradient(135deg,var(--navy)_0_2px,transparent_2px_10px)] opacity-30" />
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

      {/* Layanan */}
      <section
        className="text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
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
      </section>

      {/* Two columns */}
      <section
        className="border-t border-white/10 text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
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
