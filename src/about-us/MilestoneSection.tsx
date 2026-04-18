import type { Milestone } from "@/about-us/content";

export function MilestoneSection({ items }: { items: Milestone[] }) {
  return (
    <div className="flex flex-col">
      {items.map((m, i) => (
        <div key={`${m.year}-${i}`} className="flex gap-4 md:gap-6">
          <div className="flex w-9 shrink-0 flex-col items-center md:w-11">
            <div
              className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-accent-orange ring-4 ring-accent-orange/15"
              aria-hidden
            />
            {i < items.length - 1 ? (
              <div className="mt-2 min-h-[2.5rem] w-px flex-1 bg-border" aria-hidden />
            ) : null}
          </div>
          <div className={`min-w-0 flex-1 ${i === items.length - 1 ? "pb-0" : "pb-10"}`}>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-accent-orange">
                  {m.year}
                </span>
                <span className="text-xs text-muted-foreground">—</span>
                <h3 className="text-lg font-bold text-navy md:text-xl">{m.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {m.body}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
