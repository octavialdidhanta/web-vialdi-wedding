/**
 * Bentuk dokumen Tiptap untuk rute publik tanpa mengimpor `@tiptap/core`
 * (hindari menggabungkan `trackRegistry` / blog dengan chunk vendor Tiptap).
 */
export type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};
