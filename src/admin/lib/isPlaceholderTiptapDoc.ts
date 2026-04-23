/**
 * Deteksi dokumen Tiptap kosong / default — tanpa impor `@tiptap/*` agar rute publik (blog) tidak menarik ProseMirror.
 */
export function isPlaceholderTiptapDoc(doc: unknown): boolean {
  if (!doc || typeof doc !== "object") {
    return true;
  }
  const d = doc as { type?: string; content?: unknown[] };
  if (d.type !== "doc") {
    return true;
  }
  if (!Array.isArray(d.content) || d.content.length === 0) {
    return true;
  }
  if (d.content.length === 1) {
    const first = d.content[0] as { type?: string; content?: unknown[] };
    if (
      first?.type === "paragraph" &&
      (!Array.isArray(first.content) || first.content.length === 0)
    ) {
      return true;
    }
  }
  return false;
}
