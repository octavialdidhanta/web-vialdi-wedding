import type { TocEntry } from "@/blog/types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Pastikan setiap h2 punya id stabil untuk TOC / anchor. */
export function injectHeadingIds(html: string): { html: string; toc: TocEntry[] } {
  if (typeof window === "undefined" || !html.trim()) {
    return { html, toc: [] };
  }
  const parsed = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = parsed.getElementById("root");
  if (!root) {
    return { html, toc: [] };
  }
  const toc: TocEntry[] = [];
  const headings = root.querySelectorAll("h2");
  headings.forEach((h, i) => {
    const title = (h.textContent || "").trim() || `Bagian ${i + 1}`;
    const id = h.id?.trim() || slugify(title) || `section-${i + 1}`;
    h.id = id;
    toc.push({ id, title });
  });
  return { html: root.innerHTML, toc };
}

export function estimateReadMinutesFromHtml(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
