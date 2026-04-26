import { useEffect } from "react";
import { termsSeo } from "@/term&condition/content";

const DEFAULT_DOCUMENT_TITLE = "Vialdi Wedding";

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

export function useTermsPageMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = termsSeo.title;

    const description = upsertMeta("name", "description", termsSeo.description);
    const ogTitle = upsertMeta("property", "og:title", termsSeo.title);
    const ogDescription = upsertMeta("property", "og:description", termsSeo.description);

    return () => {
      document.title = previousTitle || DEFAULT_DOCUMENT_TITLE;
      restoreMeta(description);
      restoreMeta(ogTitle);
      restoreMeta(ogDescription);
    };
  }, []);
}
