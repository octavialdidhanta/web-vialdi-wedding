import { useEffect } from "react";

const DEFAULT_DOCUMENT_TITLE = "Vialdi.ID";

type MetaSnapshot = {
  el: HTMLMetaElement;
  hadContent: boolean;
  previousContent: string | null;
};

function upsertMeta(attr: "name" | "property", key: string, value: string): MetaSnapshot {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  const previousContent = el?.getAttribute("content") ?? null;
  const hadContent = previousContent !== null && previousContent !== "";
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
  return { el, hadContent, previousContent };
}

function restoreMeta(snapshot: MetaSnapshot) {
  if (snapshot.hadContent) {
    snapshot.el.setAttribute("content", snapshot.previousContent ?? "");
  } else {
    snapshot.el.remove();
  }
}

export function useBlogMeta(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const desc = upsertMeta("name", "description", description);
    const ogTitle = upsertMeta("property", "og:title", title);
    const ogDescription = upsertMeta("property", "og:description", description);
    const ogType = upsertMeta("property", "og:type", "article");
    const ogUrl = upsertMeta("property", "og:url", window.location.href);
    const twitterCard = upsertMeta("name", "twitter:card", "summary");
    const twitterTitle = upsertMeta("name", "twitter:title", title);
    const twitterDescription = upsertMeta("name", "twitter:description", description);

    return () => {
      document.title = previousTitle || DEFAULT_DOCUMENT_TITLE;
      restoreMeta(desc);
      restoreMeta(ogTitle);
      restoreMeta(ogDescription);
      restoreMeta(ogType);
      restoreMeta(ogUrl);
      restoreMeta(twitterCard);
      restoreMeta(twitterTitle);
      restoreMeta(twitterDescription);
    };
  }, [title, description]);
}

export type BlogMetaOptions = {
  /** URL absolut canonical untuk OG/Twitter. Default: window.location.href */
  url?: string;
  /** URL absolut gambar cover untuk preview. */
  image?: string;
  /** Default: article */
  type?: "article" | "website";
};

export function useBlogMetaWithOgImage(title: string, description: string, opts?: BlogMetaOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const desc = upsertMeta("name", "description", description);
    const ogTitle = upsertMeta("property", "og:title", title);
    const ogDescription = upsertMeta("property", "og:description", description);
    const ogType = upsertMeta("property", "og:type", opts?.type ?? "article");
    const ogUrl = upsertMeta("property", "og:url", opts?.url ?? window.location.href);

    const hasImage = Boolean(opts?.image?.trim());
    const ogImage = hasImage ? upsertMeta("property", "og:image", opts!.image!.trim()) : null;

    const twitterCard = upsertMeta("name", "twitter:card", hasImage ? "summary_large_image" : "summary");
    const twitterTitle = upsertMeta("name", "twitter:title", title);
    const twitterDescription = upsertMeta("name", "twitter:description", description);
    const twitterImage = hasImage ? upsertMeta("name", "twitter:image", opts!.image!.trim()) : null;

    return () => {
      document.title = previousTitle || DEFAULT_DOCUMENT_TITLE;
      restoreMeta(desc);
      restoreMeta(ogTitle);
      restoreMeta(ogDescription);
      restoreMeta(ogType);
      restoreMeta(ogUrl);
      if (ogImage) restoreMeta(ogImage);
      restoreMeta(twitterCard);
      restoreMeta(twitterTitle);
      restoreMeta(twitterDescription);
      if (twitterImage) restoreMeta(twitterImage);
    };
  }, [title, description, opts?.image, opts?.type, opts?.url]);
}
