import { Link } from "react-router-dom";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import {
  cta,
  founder,
  hero,
  milestones,
  milestonesIntro,
  positioning,
  storyEmpathy,
  values,
} from "@/about-us/content";
import { MilestoneSection } from "@/about-us/MilestoneSection";
import { useAboutPageMeta } from "@/about-us/useAboutPageMeta";
import { SectionTitle } from "@/1-home/components/SectionTitle";
import { Footer } from "@/share/Footer";
import { Header } from "@/share/Header";

/** Selaras mobile Home: `px-4`, dari `md:` pakai `px-6` + max-w 90rem. */
const sectionShell = "mx-auto max-w-[90rem] px-4 py-12 md:px-6 md:py-20";
const heroShell = "mx-auto max-w-[90rem] px-4 py-10 md:px-6 md:py-20";
const ctaShell =
  "mx-auto max-w-4xl px-4 pt-10 pb-16 text-center md:px-6 md:pt-12 md:pb-20 md:text-left";

export function AboutUsPage() {
  useAboutPageMeta();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-x-hidden border-b border-border/40 bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-orange/15 blur-3xl"
        />
        <div className={`relative ${heroShell}`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy shadow-sm">
            <span className="h-2 w-2 rounded-full bg-accent-orange" />
            {hero.eyebrow}
          </span>
          <h1 className="mt-6 max-w-4xl text-3xl font-bold leading-[1.15] tracking-tight text-navy md:text-4xl lg:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {hero.lead}
          </p>
        </div>
      </section>

      <section className="bg-secondary">
        <div
          className={`${sectionShell} grid gap-10 md:grid-cols-[1fr_1.05fr] md:items-start md:gap-14`}
        >
          <SectionTitle title={storyEmpathy.title} />
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            {storyEmpathy.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className={sectionShell}>
          <SectionTitle title={positioning.title} subtitle={positioning.subtitle} />
          <div className="mt-10 grid gap-5 md:mt-14 md:grid-cols-3">
            {positioning.pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md md:p-7"
              >
                <h3 className="text-lg font-bold text-navy">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/40">
        <div className={sectionShell}>
          <SectionTitle title={milestonesIntro.title} subtitle={milestonesIntro.subtitle} />
          <div className="mt-10 md:mt-12">
            <MilestoneSection items={milestones} />
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className={sectionShell}>
          <SectionTitle title={values.title} subtitle={values.subtitle} />
          <ul className="mt-10 grid gap-5 md:mt-12 md:grid-cols-3">
            {values.items.map((v) => (
              <li
                key={v.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7"
              >
                <h3 className="text-lg font-bold text-navy">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {v.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border/40 bg-secondary">
        <div
          className={`${sectionShell} grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:gap-14`}
        >
          <div className="order-2 md:order-1">
            <p className="text-lg italic leading-relaxed text-muted-foreground md:text-xl">
              "{founder.quote}"
            </p>
            <div className="mt-8">
              <p className="text-xl font-bold text-navy">{founder.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{founder.role}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{founder.bio}</p>
            </div>
          </div>
          <div className="order-1 flex justify-center md:order-2 md:justify-end">
            <div className="rounded-full border-2 border-accent-orange p-1.5 shadow-sm">
              <img
                src="/octa.jpeg"
                alt={founder.imageAlt}
                loading="lazy"
                width={200}
                height={200}
                className="h-40 w-40 rounded-full object-cover md:h-48 md:w-48"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className={ctaShell}>
          <SectionTitle title={cta.title} subtitle={cta.subtitle} />
          <div className="mt-10 flex justify-center md:justify-start">
            <Link
              to="/contact"
              data-track={TRACK_KEYS.contactCta}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90"
            >
              {cta.buttonLabel}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
