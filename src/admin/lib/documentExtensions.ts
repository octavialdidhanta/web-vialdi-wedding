import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorParagraph } from "@/admin/extensions/editorParagraph";
import { EditorLink } from "@/admin/extensions/editorLink";
import { KbdMark, FootnoteRefMark } from "@/admin/extensions/editorMarks";
import { PackageCarouselNode } from "@/admin/extensions/packageCarouselNode";

/**
 * Ekstensi dokumen tanpa React NodeView — dipakai `generateHTML` / `generateJSON` / blog chunk renderer.
 * Editor memakai superset di `editorExtensions.ts`.
 */
export const tiptapDocumentExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    paragraph: false,
    link: false,
    underline: false,
  }),
  EditorParagraph,
  EditorLink.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: {
      rel: "noopener noreferrer nofollow",
    },
  }),
  Image.configure({
    allowBase64: false,
    HTMLAttributes: {
      class: "blog-inline-img max-w-full rounded-lg border border-border",
    },
  }),
  Youtube.configure({
    // Keep embeds responsive in prose.
    HTMLAttributes: {
      class:
        "blog-embed-video aspect-video w-full overflow-hidden rounded-lg border border-border",
    },
    controls: true,
    nocookie: false,
  }),
  Underline,
  Highlight.configure({ multicolor: false }),
  Subscript,
  Superscript,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Placeholder.configure({
    placeholder: "Tulis artikel di sini…",
  }),
  KbdMark,
  FootnoteRefMark,
  PackageCarouselNode,
];
