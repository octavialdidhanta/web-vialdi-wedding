import { Mark } from "@tiptap/core";

export const KbdMark = Mark.create({
  name: "kbd",
  excludes: "code",
  parseHTML: () => [{ tag: "kbd" }],
  renderHTML: () => [
    "kbd",
    {
      class:
        "rounded border border-border bg-muted px-1.5 py-0.5 align-baseline font-mono text-[0.85em] shadow-sm",
    },
    0,
  ],
  addCommands() {
    return {
      toggleKbd:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});

/** Catatan kaki ringkas (span, bukan sistem footnote otomatis). */
export const FootnoteRefMark = Mark.create({
  name: "footnoteRef",
  excludes: "footnoteRef",
  parseHTML: () => [{ tag: "span.blog-footnote-ref" }],
  renderHTML: () => [
    "span",
    { class: "blog-footnote-ref align-super text-[0.7em] font-medium text-muted-foreground" },
    0,
  ],
  addCommands() {
    return {
      toggleFootnoteRef:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});
