declare global {
  interface Window {
    loadMetaPixel?: () => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type MetaStandardEvent = "PageView" | "Lead" | "Contact" | "CompleteRegistration";

export function metaPixelTrack(event: MetaStandardEvent, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (typeof window.loadMetaPixel === "function") {
      window.loadMetaPixel();
    }
  } catch {
    // ignore
  }

  if (typeof window.fbq !== "function") {
    return;
  }

  try {
    if (params && Object.keys(params).length > 0) {
      window.fbq("track", event, params);
    } else {
      window.fbq("track", event);
    }
  } catch {
    // ignore
  }
}

