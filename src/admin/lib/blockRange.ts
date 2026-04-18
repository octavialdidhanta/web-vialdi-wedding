import type { Editor } from "@tiptap/core";

/** Rentang node blok terluar yang langsung di bawah `doc` (paragraf, list, heading, dll.). */
export function getClosestDocBlockBound(editor: Editor): {
  from: number;
  to: number;
  depth: number;
} | null {
  const { $from } = editor.state.selection;
  for (let d = 1; d <= $from.depth; d++) {
    if ($from.node(d - 1).type.name === "doc") {
      return { from: $from.before(d), to: $from.after(d), depth: d };
    }
  }
  return null;
}

export function isParagraphBlock(editor: Editor): boolean {
  const b = getClosestDocBlockBound(editor);
  if (!b) {
    return false;
  }
  const node = editor.state.doc.nodeAt(b.from);
  return node?.type.name === "paragraph";
}
