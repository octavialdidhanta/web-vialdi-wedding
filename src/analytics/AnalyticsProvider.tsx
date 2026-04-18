import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  buildSessionTouchEvent,
  getOptionalAuthUserId,
  getOrCreateSessionId,
  sendAnalyticsBatch,
  type IngestEvent,
} from "@/analytics/sendAnalyticsBatch";

const HEARTBEAT_MS = 15_000;
const DEDUPE_MS = 30_000;

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin");
}

function labelFromElement(el: Element): string {
  const t = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  return t.slice(0, 120) || el.tagName.toLowerCase();
}

function isInternalHref(href: string): boolean {
  try {
    const u = new URL(href, window.location.origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return false;
    }
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const pathRef = useRef<string>("");
  const lastPageViewAtRef = useRef<Map<string, number>>(new Map());
  const visibleSinceRef = useRef<number | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flushDuration = useCallback((path: string, opts?: { useBeacon?: boolean }) => {
    if (!path || isAdminPath(path)) {
      return;
    }
    if (visibleSinceRef.current == null) {
      return;
    }
    const now = Date.now();
    const delta = now - visibleSinceRef.current;
    if (document.visibilityState === "visible") {
      visibleSinceRef.current = now;
    } else {
      visibleSinceRef.current = null;
    }
    if (delta > 0 && delta < 120_000) {
      void sendAnalyticsBatch([{ type: "active_ping", path, delta_ms: delta }], {
        useBeacon: opts?.useBeacon,
      });
    }
  }, []);

  const endPage = useCallback(
    (path: string, opts?: { useBeacon?: boolean }) => {
      if (!path || isAdminPath(path)) {
        return;
      }
      flushDuration(path, opts);
      void sendAnalyticsBatch([{ type: "page_end", path }], { useBeacon: opts?.useBeacon });
    },
    [flushDuration],
  );

  const startPage = useCallback(async (path: string) => {
    if (!path || isAdminPath(path)) {
      return;
    }
    const now = Date.now();
    const last = lastPageViewAtRef.current.get(path) ?? 0;
    if (now - last < DEDUPE_MS) {
      return;
    }
    lastPageViewAtRef.current.set(path, now);
    getOrCreateSessionId();
    const auth = await getOptionalAuthUserId();
    await sendAnalyticsBatch([buildSessionTouchEvent(), { type: "page_view", path }], {
      authUserId: auth,
    });
  }, []);

  useEffect(() => {
    const path = location.pathname || "/";

    if (isAdminPath(path)) {
      const prev = pathRef.current;
      if (prev && !isAdminPath(prev)) {
        endPage(prev);
      }
      pathRef.current = "";
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      visibleSinceRef.current = null;
      return;
    }

    const prev = pathRef.current;
    if (prev && prev !== path) {
      endPage(prev);
    }
    pathRef.current = path;
    void startPage(path);
    visibleSinceRef.current = Date.now();

    const onVis = () => {
      const p = pathRef.current;
      if (!p || isAdminPath(p)) {
        return;
      }
      if (document.visibilityState === "visible") {
        visibleSinceRef.current = Date.now();
      } else {
        flushDuration(p);
      }
    };

    document.addEventListener("visibilitychange", onVis);

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    heartbeatRef.current = setInterval(() => {
      const p = pathRef.current;
      if (!p || isAdminPath(p) || document.visibilityState !== "visible") {
        return;
      }
      flushDuration(p);
    }, HEARTBEAT_MS);

    const onPageHide = () => {
      const p = pathRef.current;
      if (p && !isAdminPath(p)) {
        endPage(p, { useBeacon: true });
      }
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [location.pathname, endPage, flushDuration, startPage]);

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const path = pathRef.current;
      if (!path || isAdminPath(path)) {
        return;
      }
      const target = ev.target as Element | null;
      if (!target) {
        return;
      }
      const el = target.closest("a[href],button,[data-track],[data-track-click]");
      if (!el) {
        return;
      }
      if (el.closest("[data-analytics-ignore]")) {
        return;
      }

      const trackKey = el.getAttribute("data-track") || el.getAttribute("data-track-click");
      const tag = el.tagName.toLowerCase();
      let targetUrl: string | null = null;
      let isInternal = false;

      if (tag === "a") {
        const href = (el as HTMLAnchorElement).getAttribute("href") ?? "";
        if (!href || href.startsWith("#")) {
          return;
        }
        try {
          targetUrl = new URL(href, window.location.origin).href;
          isInternal = isInternalHref(href);
        } catch {
          targetUrl = href;
        }
      }

      const evt: IngestEvent = {
        type: "click",
        path,
        track_key: trackKey,
        element_type: tag,
        element_label: labelFromElement(el),
        target_url: targetUrl,
        is_internal: isInternal,
      };

      void sendAnalyticsBatch([evt]);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <>{children}</>;
}
