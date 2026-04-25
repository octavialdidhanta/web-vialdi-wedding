import { Link } from "react-router-dom";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { CreativeSocialCardsCarousel } from "@/service/CreativeSocialCardsCarousel";
import { serviceSections, servicesCtas, servicesHero } from "@/service/content";
import { useServicesPageMeta } from "@/service/useServicesPageMeta";
import { Header } from "@/share/Header";
import { Footer } from "@/share/Footer";
import { cn } from "@/share/lib/utils";

export function OurServicesPage() {
  useServicesPageMeta();

  return (
    <div className="min-h-screen bg-background" id="top">
      <Header />

      {/* Hero */}
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

        <div className="relative mx-auto max-w-[90rem] px-4 py-8 md:px-6 md:py-20">
          <div className="max-w-4xl">
            {servicesHero.eyebrow ? (
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy shadow-sm">
                <span className="h-2 w-2 rounded-full bg-accent-orange" />
                {servicesHero.eyebrow}
              </p>
            ) : null}
            <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-navy md:text-5xl lg:text-[3.35rem]">
              {servicesHero.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {servicesHero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to={servicesCtas.primaryHref}
                {...(servicesCtas.primaryHref === "/contact"
                  ? { "data-track": TRACK_KEYS.contactCta }
                  : {})}
                className="rounded-full bg-navy px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:bg-accent-orange hover:shadow-lg"
              >
                {servicesCtas.primaryLabel}
              </Link>
            </div>

            {/* Quick navigation */}
            <div className="no-scrollbar mt-8 -mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
              <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
                {serviceSections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-navy transition-colors hover:border-accent-orange hover:text-accent-orange"
                  >
                    {s.title.replace(/:$/, "")}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="bg-background">
        <div className="mx-auto max-w-[90rem] space-y-8 px-4 py-14 md:space-y-10 md:px-6 md:py-20">
          {serviceSections.map((sec) => (
            <div key={sec.id} id={sec.id} className="scroll-mt-24">
              {/* Content card */}
              <div className="rounded-3xl border border-border bg-card px-4 py-6 shadow-sm md:px-10 md:py-10">
                <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
                        {sec.title}
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-accent-orange/15 px-3 py-1 text-xs font-semibold text-accent-orange">
                        {sec.fee}
                      </span>
                    </div>

                    {sec.description?.length ? (
                      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                        {sec.description.map((p) => (
                          <p key={p}>{p}</p>
                        ))}
                      </div>
                    ) : null}

                    {sec.bullets?.length ? (
                      <ul className="mt-5 space-y-2 text-sm text-muted-foreground md:text-base">
                        {sec.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-orange" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        to={servicesCtas.primaryHref}
                        {...(servicesCtas.primaryHref === "/contact"
                          ? { "data-track": TRACK_KEYS.contactCta }
                          : {})}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90"
                      >
                        {sec.ctaEmoji === "👍" ? "👍" : "👉"} {sec.ctaLabel}
                      </Link>
                    </div>
                  </div>

                  {/* Desktop (lg+): carousel + center scale — hanya Creative & Social Media */}
                  {sec.id === "creative-social" ? (
                    <div className="hidden min-w-0 lg:flex lg:justify-center">
                      <CreativeSocialCardsCarousel items={sec.items} />
                    </div>
                  ) : null}

                  {/* Tablet & desktop grid (2 kolom); untuk creative-social disembunyikan mulai lg */}
                  <div
                    className={cn(
                      "hidden min-w-0 sm:block",
                      sec.id === "creative-social" && "lg:hidden",
                    )}
                  >
                    <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
                      {sec.items.map((it) => {
                        const Icon = it.icon;
                        const detailHref = it.detailHref ?? servicesCtas.primaryHref;
                        return (
                          <div
                            key={it.title}
                            className="group flex flex-col rounded-2xl border border-border bg-background px-4 py-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
                          >
                            <div className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-navy transition-colors group-hover:bg-accent-orange/15 group-hover:text-accent-orange">
                              <Icon className="h-7 w-7" aria-hidden />
                            </div>
                            <div className="mt-4 min-h-0 flex-1 text-sm font-semibold leading-snug text-navy">
                              {it.title}
                            </div>
                            <Link
                              to={detailHref}
                              {...(detailHref === "/contact"
                                ? { "data-track": TRACK_KEYS.contactCta }
                                : {})}
                              className="mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-navy shadow-sm transition-colors hover:border-accent-orange hover:text-accent-orange"
                              aria-label={`Lihat detail: ${it.title}`}
                            >
                              Lihat Detail
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile: full-bleed row OUTSIDE the content card */}
              <div className="relative sm:hidden">
                <div className="relative left-1/2 right-1/2 -mx-[50vw] -mt-3 w-screen">
                  {/* Spacer to visually connect sections */}
                  <div className="h-3" />
                </div>
                <div className="no-scrollbar relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-x-auto bg-card/60 px-4 pb-3 pt-4">
                  <div className="flex w-max gap-3">
                    {sec.items.map((it) => {
                      const Icon = it.icon;
                      const detailHref = it.detailHref ?? servicesCtas.primaryHref;
                      return (
                        <div
                          key={it.title}
                          className="group flex min-w-[168px] max-w-[200px] flex-col rounded-2xl border border-border bg-card px-4 py-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
                        >
                          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-navy transition-colors group-hover:bg-accent-orange/15 group-hover:text-accent-orange">
                            <Icon className="h-6 w-6" aria-hidden />
                          </div>
                          <div className="mt-3 min-h-0 flex-1 text-sm font-semibold leading-snug text-navy">
                            {it.title}
                          </div>
                          <Link
                            to={detailHref}
                            {...(detailHref === "/contact"
                              ? { "data-track": TRACK_KEYS.contactCta }
                              : {})}
                            className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-full border border-border bg-background px-2 py-2 text-xs font-semibold text-navy shadow-sm transition-colors hover:border-accent-orange hover:text-accent-orange"
                            aria-label={`Lihat detail: ${it.title}`}
                          >
                            Lihat Detail
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
