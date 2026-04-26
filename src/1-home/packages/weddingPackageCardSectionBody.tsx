import type { WeddingPackageSection } from "@/blog/weddingPackages";

export function WeddingPackageSectionBody({ s }: { s: WeddingPackageSection }) {
  return (
    <>
      {s.intro ? <p className="text-muted-foreground">{s.intro}</p> : null}
      {s.bullets?.length ? (
        <ul
          className={`list-disc space-y-1.5 pl-4 text-foreground/90 ${s.intro ? "mt-3" : ""}`}
        >
          {s.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      {s.bullet_items?.length ? (
        <ul
          className={`list-disc space-y-1.5 pl-4 text-foreground/90 ${s.intro ? "mt-3" : ""}`}
        >
          {s.bullet_items.map((line) => (
            <li
              key={line.text}
              className={line.struck ? "text-muted-foreground line-through" : ""}
            >
              {line.text}
            </li>
          ))}
        </ul>
      ) : null}
      {s.bonus_lines?.length ? (
        <ul
          className={`list-disc space-y-1.5 pl-4 text-foreground/90 ${s.intro ? "mt-3" : ""}`}
        >
          {s.bonus_lines.map((line) => (
            <li
              key={line.text}
              className={line.struck ? "text-muted-foreground line-through" : ""}
            >
              {line.text}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
