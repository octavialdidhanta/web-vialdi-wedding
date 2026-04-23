import { Editor } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import { tiptapDocumentExtensions } from "@/admin/lib/documentExtensions";
import { isPlaceholderTiptapDoc } from "@/admin/lib/isPlaceholderTiptapDoc";

const emptyDoc: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

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
