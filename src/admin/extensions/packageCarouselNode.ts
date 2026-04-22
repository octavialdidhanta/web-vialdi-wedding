import { Node, mergeAttributes } from "@tiptap/core";

export const PACKAGE_CAROUSEL_ATTR = "data-vialdi-package-carousel";

/** Blok atom: carousel paket (atribut JSON + placeholder HTML). */
export const PackageCarouselNode = Node.create({
  name: "packageCarousel",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      packageIds: {
        default: [] as string[],
        parseHTML: (element) => {
          const raw = element.getAttribute(PACKAGE_CAROUSEL_ATTR) ?? "";
          return raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        },
        renderHTML: (attributes) => {
          const ids = attributes.packageIds as string[] | undefined;
          if (!ids?.length) {
            return {};
          }
          return { [PACKAGE_CAROUSEL_ATTR]: ids.join(",") };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[${PACKAGE_CAROUSEL_ATTR}]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "blog-package-carousel-embed my-6",
      }),
    ];
  },
});
