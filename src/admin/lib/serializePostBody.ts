import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import type { TocEntry } from "@/blog/types";
import { injectHeadingIds, estimateReadMinutesFromHtml } from "@/admin/lib/htmlPostProcess";
import { tiptapExtensions } from "@/admin/lib/editorExtensions";
import { stripHiddenFromBodyHtml } from "@/admin/lib/stripHiddenHtml";

export { tiptapExtensions } from "@/admin/lib/editorExtensions";

export function docJsonToHtml(doc: JSONContent | null | undefined): string {
  if (!doc || !doc.type) {
    return "";
  }
  return generateHTML(doc, tiptapExtensions);
}

export function serializeEditorDocument(doc: JSONContent | null | undefined): {
  body_html: string;
  toc_json: TocEntry[];
  read_time_minutes: number;
} {
  const raw = docJsonToHtml(doc);
  const { html, toc } = injectHeadingIds(raw);
  const body_html = stripHiddenFromBodyHtml(html);
  return {
    body_html,
    toc_json: toc,
    read_time_minutes: estimateReadMinutesFromHtml(html),
  };
}
