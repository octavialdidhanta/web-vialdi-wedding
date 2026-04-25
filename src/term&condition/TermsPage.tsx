import { Link } from "react-router-dom";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { termsFooter, termsHero, termsSections } from "@/term&condition/content";
import { useTermsPageMeta } from "@/term&condition/useTermsPageMeta";
import { Footer } from "@/share/Footer";
import { Header } from "@/share/Header";

export function TermsPage() {
  useTermsPageMeta();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden border-b border-border/40 bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="relative mx-auto max-w-[90rem] px-6 py-10 md:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy shadow-sm">
            <span className="h-2 w-2 rounded-full bg-accent-orange" />
            {termsHero.eyebrow}
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-navy md:text-4xl lg:text-5xl">
            {termsHero.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
            {termsHero.lastUpdated}
          </p>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {termsHero.lead}
          </p>
        </div>
      </section>

      <section className="bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
          <nav
            aria-label="Daftar isi"
            className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Daftar isi
            </p>
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm font-bold text-navy md:text-base">
              {termsSections.map((s) => (
                <li key={s.id} className="marker:font-bold">
                  <a
                    href={`#${s.id}`}
                    className="underline-offset-4 transition-colors hover:text-accent-orange hover:underline"
                  >
                    {s.title.replace(/^\d+\.\s*/, "")}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-12 space-y-12 md:mt-14 md:space-y-14">
            {termsSections.map((s) => (
              <article key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-bold text-navy md:text-2xl">{s.title}</h2>
                <div className="mt-3 h-1 w-12 rounded-full bg-accent-orange" />
                <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {s.paragraphs.map((p, i) => (
                    <p key={`${s.id}-p-${i}`}>{p}</p>
                  ))}
                  {s.bullets?.length ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-border bg-card p-6 text-center shadow-sm md:mt-16">
            <p className="text-sm text-muted-foreground">
              Ada pertanyaan terkait dokumen ini?{" "}
              <Link
                to="/contact"
                data-track={TRACK_KEYS.contactCta}
                className="font-semibold text-accent-orange underline-offset-2 hover:underline"
              >
                Hubungi kami
              </Link>
            </p>
            <p className="mt-4 text-xs text-muted-foreground">{termsFooter.entityLine}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
