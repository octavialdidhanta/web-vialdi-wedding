import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — vialdi.id" },
      { name: "description", content: "Insight dan artikel tentang digital marketing, lead generation, dan strategi penjualan." },
      { property: "og:title", content: "Blog — vialdi.id" },
      { property: "og:description", content: "Insight digital marketing dan strategi penjualan." },
    ],
  }),
  component: BlogPage,
});

const posts = [
  { title: "5 Strategi Lead Generation Efektif di 2025", date: "12 Apr 2025", excerpt: "Pelajari pendekatan modern untuk menjaring prospek berkualitas." },
  { title: "Mengapa Digital Presence Itu Penting", date: "03 Apr 2025", excerpt: "Bangun fondasi digital yang membuat brand Anda dipercaya." },
  { title: "Copywriting yang Mengonversi", date: "21 Mar 2025", excerpt: "Teknik menulis copy yang mendorong tindakan." },
];

function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-4xl font-bold text-navy md:text-5xl">Blog</h1>
        <p className="mt-4 text-muted-foreground">Insight terbaru seputar digital marketing.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-elegant)]"
            >
              <p className="text-xs font-medium text-primary">{p.date}</p>
              <h2 className="mt-3 text-lg font-bold text-navy">{p.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
