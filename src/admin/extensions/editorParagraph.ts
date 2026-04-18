import Paragraph from "@tiptap/extension-paragraph";

export const EditorParagraph = Paragraph.extend({
  addAttributes() {
    return {
      dataPublic: {
        default: "true",
        parseHTML: (el) => el.getAttribute("data-public") ?? "true",
        renderHTML: (attrs) => (attrs.dataPublic === "false" ? { "data-public": "false" } : {}),
      },
      dataLocked: {
        default: "false",
        parseHTML: (el) => el.getAttribute("data-locked") ?? "false",
        renderHTML: (attrs) => (attrs.dataLocked === "true" ? { "data-locked": "true" } : {}),
      },
      dataLabel: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-label"),
        renderHTML: (attrs) => (attrs.dataLabel ? { "data-label": attrs.dataLabel } : {}),
      },
    };
  },
});
