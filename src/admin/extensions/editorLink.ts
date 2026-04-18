import TiptapLink from "@tiptap/extension-link";

export const EditorLink = TiptapLink.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute("class"),
        renderHTML: (attrs) => {
          if (!attrs.class) {
            return {};
          }
          return { class: attrs.class as string };
        },
      },
    };
  },
});
