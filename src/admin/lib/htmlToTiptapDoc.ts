import { Editor } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import { tiptapDocumentExtensions } from "@/admin/lib/documentExtensions";

const emptyDoc: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

/** Dokumen kosong / tidak valid / satu paragraf kosong — artikel asli mungkin hanya di `body_html`. */
export function isPlaceholderTiptapDoc(doc: JSONContent | null | undefined): boolean {
  if (!doc || doc.type !== "doc") {
    return true;
  }
  if (!doc.content?.length) {
    return true;
  }
  if (doc.content.length === 1) {
    const first = doc.content[0];
    if (
      first?.type === "paragraph" &&
      (!("content" in first) || !first.content || first.content.length === 0)
    ) {
      return true;
    }
  }
  return false;
}

/** Muat `body_json` yang dipakai editor; jika placeholder dan ada HTML, parse HTML → JSON (sama seperti Tiptap). */
export function normalizePostBodyJson(bodyJson: unknown, bodyHtml: string): JSONContent {
  const doc = bodyJson as JSONContent | null;
  if (!isPlaceholderTiptapDoc(doc)) {
    return doc!;
  }
  const html = bodyHtml.trim();
  if (!html) {
    return emptyDoc;
  }
  try {
    const ed = new Editor({
      extensions: tiptapDocumentExtensions,
      content: html,
      editable: false,
    });
    const json = ed.getJSON() as JSONContent;
    ed.destroy();
    if (!isPlaceholderTiptapDoc(json)) {
      return json;
    }
  } catch {
    /* abaikan */
  }
  return emptyDoc;
}
