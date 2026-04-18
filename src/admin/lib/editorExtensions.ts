import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorParagraph } from "@/admin/extensions/editorParagraph";
import { EditorLink } from "@/admin/extensions/editorLink";
import { KbdMark, FootnoteRefMark } from "@/admin/extensions/editorMarks";

export const tiptapExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    paragraph: false,
    /** Hindari duplikat dengan EditorLink / Underline di bawah. */
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
];
