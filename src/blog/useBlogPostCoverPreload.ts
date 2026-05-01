import { useLayoutEffect } from "react";

import type { BlogCoverImgProps } from "@/blog/blogCoverImageUrls";

const LINK_ID = "blog-post-lcp-cover-preload";

/**
 * Memicu fetch gambar cover sejak layout commit (setelah data post ada),
 * dan menandai prioritas tinggi — melengkapi `<img fetchPriority="high">` untuk LCP.
 */
export function useBlogPostCoverPreload(cover: BlogCoverImgProps | undefined) {
  useLayoutEffect(() => {
    if (!cover?.src) {
      document.getElementById(LINK_ID)?.remove();
      return;
    }

    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "preload";
      link.as = "image";
      document.head.appendChild(link);
    }
    link.href = cover.src;
    link.setAttribute("fetchpriority", "high");
    if (cover.srcSet) {
      link.setAttribute("imagesrcset", cover.srcSet);
      link.setAttribute("imagesizes", cover.sizes);
    } else {
      link.removeAttribute("imagesrcset");
      link.removeAttribute("imagesizes");
    }

    return () => {
      link?.remove();
    };
  }, [cover?.src, cover?.srcSet, cover?.sizes]);
}
