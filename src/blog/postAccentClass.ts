import type { BlogAccent } from "@/blog/types";

const accentGradients: Record<BlogAccent, string> = {
  navy: "from-navy/90 to-navy/40",
  orange: "from-accent-orange/90 to-accent-orange/35",
  emerald: "from-emerald-700/85 to-emerald-500/35",
  violet: "from-violet-700/85 to-violet-500/35",
};

export function postAccentClass(accent: BlogAccent): string {
  return accentGradients[accent];
}
