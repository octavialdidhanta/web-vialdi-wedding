import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — vialdi.id" },
      { name: "description", content: "Hubungi vialdi.id untuk konsultasi digital marketing dan lead generation." },
      { property: "og:title", content: "Contact — vialdi.id" },
      { property: "og:description", content: "Hubungi tim vialdi.id untuk konsultasi gratis." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-bold text-navy md:text-5xl">Hubungi Kami</h1>
        <p className="mt-4 text-muted-foreground">
          Ceritakan kebutuhan bisnis Anda — tim kami akan merespon dalam 24 jam.
        </p>
        <form className="mt-10 space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-navy">Nama</span>
              <input className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy">Email</span>
              <input type="email" className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-navy">Pesan</span>
            <textarea rows={5} className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </label>
          <button
            type="submit"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-opacity hover:opacity-90"
          >
            Kirim Pesan
          </button>
        </form>
      </section>
    </div>
  );
}
