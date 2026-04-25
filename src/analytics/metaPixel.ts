type FbqFn = (...args: unknown[]) => void;

type MetaPixelWindow = Window & {
  fbq?: FbqFn;
  loadMetaPixel?: () => void;
  __fbqEventQueue?: Array<{ args: unknown[] }>;
  __fbqQueueFlusherAttached?: boolean;
};

function getWin(): MetaPixelWindow | null {
  if (typeof window === "undefined") return null;
  return window as MetaPixelWindow;
}

function ensurePixelLoaded(): void {
  const w = getWin();
  if (!w) return;
  w.loadMetaPixel?.();
}

function ensureQueue(): Array<{ args: unknown[] }> {
  const w = getWin();
  if (!w) return [];
  w.__fbqEventQueue = w.__fbqEventQueue ?? [];

  if (!w.__fbqQueueFlusherAttached) {
    w.__fbqQueueFlusherAttached = true;
    const flush = () => {
      if (typeof w.fbq !== "function" || !w.__fbqEventQueue?.length) return;
      const q = w.__fbqEventQueue.splice(0, w.__fbqEventQueue.length);
      for (const item of q) {
        try {
          w.fbq!(...item.args);
        } catch {
          // ignore
        }
      }
    };
    // Flush queue after the script likely loaded, without adding work to critical path.
    window.setTimeout(flush, 0);
    window.addEventListener("load", () => window.setTimeout(flush, 0), { once: true });
  }

  return w.__fbqEventQueue;
}

function callOrQueue(args: unknown[]): void {
  const w = getWin();
  if (!w) return;
  ensurePixelLoaded();
  if (typeof w.fbq === "function") {
    w.fbq(...args);
    return;
  }
  ensureQueue().push({ args });
}

export function trackMetaStandardEvent(
  eventName: string,
  params?: Record<string, unknown>,
  opts?: { eventId?: string },
): void {
  if (!eventName) return;
  const args: unknown[] =
    params || opts?.eventId
      ? ["track", eventName, params ?? {}, opts?.eventId ? { eventID: opts.eventId } : undefined].filter(
          (v) => v !== undefined,
        )
      : ["track", eventName];
  callOrQueue(args);
}

export function trackMetaCustomEvent(
  eventName: string,
  params?: Record<string, unknown>,
  opts?: { eventId?: string },
): void {
  if (!eventName) return;
  const args: unknown[] =
    params || opts?.eventId
      ? [
          "trackCustom",
          eventName,
          params ?? {},
          opts?.eventId ? { eventID: opts.eventId } : undefined,
        ].filter((v) => v !== undefined)
      : ["trackCustom", eventName];
  callOrQueue(args);
}

type MetaStandardEvent = "PageView" | "Lead" | "Contact" | "CompleteRegistration";

// Backwards-compatible helper used by some pages.
export function metaPixelTrack(event: MetaStandardEvent, params?: Record<string, unknown>): void {
  trackMetaStandardEvent(event, params);
}

