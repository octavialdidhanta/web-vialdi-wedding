import type { Editor } from "@tiptap/core";
import { generateHTML, generateJSON } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { tiptapExtensions } from "@/admin/lib/editorExtensions";
import { getClosestDocBlockBound } from "@/admin/lib/blockRange";

export function duplicateDocBlock(editor: Editor): boolean {
  const b = getClosestDocBlockBound(editor);
  if (!b) {
    return false;
  }
  const node = editor.state.doc.nodeAt(b.from);
  if (!node) {
    return false;
  }
  const json = node.toJSON() as JSONContent;
  return editor.chain().focus().insertContentAt(b.to, json).run();
}

export function insertParagraphBefore(editor: Editor): boolean {
  const b = getClosestDocBlockBound(editor);
  if (!b) {
    return false;
  }
  return editor.chain().focus().insertContentAt(b.from, { type: "paragraph" }).run();
}

export function insertParagraphAfter(editor: Editor): boolean {
  const b = getClosestDocBlockBound(editor);
  if (!b) {
    return false;
  }
  return editor.chain().focus().insertContentAt(b.to, { type: "paragraph" }).run();
}

export function deleteDocBlock(editor: Editor): boolean {
  const b = getClosestDocBlockBound(editor);
  if (!b) {
    return false;
  }
  return editor.chain().focus().deleteRange({ from: b.from, to: b.to }).run();
}

export function moveDocBlockUp(editor: Editor): boolean {
  const b = getClosestDocBlockBound(editor);
  if (!b || b.from <= 1) {
    return false;
  }
  const prev = editor.state.doc.resolve(b.from).nodeBefore;
  if (!prev) {
    return false;
  }
  const prevFrom = b.from - prev.nodeSize;
  const slice = editor.state.doc.slice(b.from, b.to);
  const tr = editor.state.tr.delete(b.from, b.to).insert(prevFrom, slice.content);
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}

export function moveDocBlockDown(editor: Editor): boolean {
  const b = getClosestDocBlockBound(editor);
  if (!b) {
    return false;
  }
  const next = editor.state.doc.resolve(b.to).nodeAfter;
  if (!next) {
    return false;
  }
  const slice = editor.state.doc.slice(b.from, b.to);
  const tr = editor.state.tr.delete(b.from, b.to).insert(b.from + next.nodeSize, slice.content);
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}

export function blockNodeToHtmlFragment(editor: Editor): string | null {
  const b = getClosestDocBlockBound(editor);
  if (!b) {
    return null;
  }
  const node = editor.state.doc.nodeAt(b.from);
  if (!node) {
    return null;
  }
  const json = { type: "doc", content: [node.toJSON()] } as JSONContent;
  return generateHTML(json, tiptapExtensions);
}

export function setParagraphMeta(
  editor: Editor,
  patch: Partial<{ dataPublic: string; dataLocked: string; dataLabel: string | null }>,
): boolean {
  const b = getClosestDocBlockBound(editor);
  if (!b) {
    return false;
  }
  const node = editor.state.doc.nodeAt(b.from);
  if (!node || node.type.name !== "paragraph") {
    return false;
  }
  const attrs = { ...node.attrs, ...patch };
  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.setNodeMarkup(b.from, undefined, attrs);
      return true;
    })
    .run();
}

export function replaceDocBlockFromHtml(editor: Editor, html: string): boolean {
  const b = getClosestDocBlockBound(editor);
  if (!b) {
    return false;
  }
  const wrapped = html.trim().startsWith("<") ? html : `<p>${html}</p>`;
  let docJson: JSONContent;
  try {
    docJson = generateJSON(wrapped, tiptapExtensions) as JSONContent;
  } catch {
    return false;
  }
  const first = docJson?.content?.[0];
  if (!first) {
    return false;
  }
  return editor
    .chain()
    .focus()
    .deleteRange({ from: b.from, to: b.to })
    .insertContentAt(b.from, first)
    .run();
}

export type CopiedMarksState = { markName: string; attrs: Record<string, unknown> }[];

export function copyActiveMarks(editor: Editor): CopiedMarksState {
  const { $from } = editor.state.selection;
  const marks = $from.marks();
  return marks.map((m) => ({ markName: m.type.name, attrs: { ...m.attrs } }));
}

export function pasteMarks(editor: Editor, stored: CopiedMarksState | null): boolean {
  if (!stored?.length) {
    return false;
  }
  let chain = editor.chain().focus();
  chain = chain.unsetAllMarks();
  for (const sm of stored) {
    const type = editor.schema.marks[sm.markName];
    if (type) {
      chain = chain.setMark(type, sm.attrs as Record<string, unknown>);
    }
  }
  return chain.run();
}
