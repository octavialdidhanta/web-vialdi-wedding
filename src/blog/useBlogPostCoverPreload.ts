import { useLayoutEffect } from "react";

const LINK_ID = "blog-post-lcp-cover-preload";

/**
 * Memicu fetch gambar cover sejak layout commit (setelah data post ada),
 * dan menandai prioritas tinggi — melengkapi `<img fetchPriority="high">` untuk LCP.
 */
export function useBlogPostCoverPreload(coverImage: string | undefined) {
  useLayoutEffect(() => {
    if (!coverImage) {
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
    link.href = coverImage;
    link.setAttribute("fetchpriority", "high");

    return () => {
      link?.remove();
    };
  }, [coverImage]);
}
