import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/service")({
  head: () => ({
    meta: [
      { title: "Service — vialdi.id" },
      { name: "description", content: "Layanan digital marketing, lead generation, dan optimasi bisnis dari vialdi.id." },
      { property: "og:title", content: "Service — vialdi.id" },
      { property: "og:description", content: "Layanan digital marketing dan lead generation." },
    ],
  }),
  component: ServicePage,
});

function ServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-4xl font-bold text-navy md:text-5xl">Layanan Kami</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Solusi end-to-end untuk pertumbuhan bisnis Anda — dari akuisisi lead hingga optimasi
          digital.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            ["Lead Acquisition", "Strategi terukur untuk mendapatkan lead berkualitas."],
            ["Lead Activation", "Konversi prospek menjadi pelanggan aktif."],
            ["Digital Presence", "Bangun brand presence yang kuat di kanal digital."],
            ["Digital Optimization", "Optimasi performa kampanye dan funnel."],
          ].map(([title, desc]) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-8 transition-shadow hover:shadow-[var(--shadow-elegant)]"
            >
              <span className="inline-block rounded-md bg-accent-orange px-3 py-1 text-xs font-semibold text-navy">
                {title}
              </span>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
