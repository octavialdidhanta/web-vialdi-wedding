import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import {
  buildSessionTouchEvent,
  ensureLandingAttributionCaptured,
  getOrCreateSessionId,
  sendAnalyticsBatch,
  type IngestEvent,
} from "@/analytics/sendAnalyticsBatch";
import {
  pushGtmFormSubmit,
  pushGtmUserInteraction,
  pushGtmVirtualPageView,
} from "@/analytics/gtmDataLayer";
import { Toaster } from "@/share/ui/sonner";

const HEARTBEAT_MS = 15_000;
const DEDUPE_MS = 30_000;

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin");
}

function normalizePathname(pathname: string): string {
  const p = pathname || "/";
  if (p !== "/" && p.endsWith("/")) {
    return p.replace(/\/+$/, "") || "/";
  }
  return p;
}

function readPathnameFromBrowser(): string {
  if (typeof window === "undefined") {
    return "/";
  }
  return normalizePathname(window.location.pathname || "/");
}

function labelFromElement(el: Element): string {
  const t = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  return t.slice(0, 120) || el.tagName.toLowerCase();
}

function labelForGtm(el: Element): string {
  const aria = el.getAttribute("aria-label");
  if (aria?.trim()) {
    return aria.trim().slice(0, 120);
  }
  const title = el.getAttribute("title");
  if (title?.trim()) {
    return title.trim().slice(0, 120);
  }
  if (el instanceof HTMLInputElement) {
    const v = (el.value || el.placeholder || "").trim();
    if (v) {
      return v.slice(0, 120);
    }
  }
  return labelFromElement(el);
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

/**
 * Layout route + pathname dari `window.location` + patch History API agar setiap
 * navigasi SPA (Link/navigate/pushState) memicu page_view — tidak bergantung
 * hanya pada timing `useLocation` di layout.
 */
export function AnalyticsProvider() {
  const pathRef = useRef<string>("");
  const lastPageViewAtRef = useRef<Map<string, number>>(new Map());
  const visibleSinceRef = useRef<number | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const endPageRef = useRef<(path: string, opts?: { useBeacon?: boolean }) => void>(() => {});
  const flushDurationRef = useRef<(path: string, opts?: { useBeacon?: boolean }) => void>(() => {});
  const startPageRef = useRef<(path: string) => Promise<void>>(async () => {});

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
        deferNetwork: !opts?.useBeacon,
      });
    }
  }, []);

  const endPage = useCallback(
    (path: string, opts?: { useBeacon?: boolean }) => {
      if (!path || isAdminPath(path)) {
        return;
      }
      flushDuration(path, opts);
      void sendAnalyticsBatch([{ type: "page_end", path }], {
        useBeacon: opts?.useBeacon,
        deferNetwork: !opts?.useBeacon,
      });
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
    await sendAnalyticsBatch([buildSessionTouchEvent(), { type: "page_view", path }], {
      keepalive: true,
      deferNetwork: true,
      /** Hindari kompetisi dengan LCP (hero + bundle beranda). */
      deferNetworkLeadMs: 4500,
    });
  }, []);

  endPageRef.current = endPage;
  flushDurationRef.current = flushDuration;
  startPageRef.current = startPage;

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && !isAdminPath(readPathnameFromBrowser())) {
      ensureLandingAttributionCaptured();
    }

    const endPage = (path: string, opts?: { useBeacon?: boolean }) =>
      endPageRef.current(path, opts);
    const flushDuration = (path: string, opts?: { useBeacon?: boolean }) =>
      flushDurationRef.current(path, opts);
    const startPage = (path: string) => void startPageRef.current(path);

    const clearHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    const attachListenersForPath = () => {
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
        clearHeartbeat();
      };
    };

    let detachDomListeners: (() => void) | undefined;
    let lastGtmPath: string | null = null;
    let loadIdleHooked = false;

    const scheduleDeferredStartPage = () => {
      const run = () => {
        const p = pathRef.current;
        if (!p || isAdminPath(p)) {
          return;
        }
        void startPageRef.current(p);
      };
      const runIdle = () => {
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(run, { timeout: 6000 });
        } else {
          setTimeout(run, 0);
        }
      };
      /** Satu listener load; isi path diambil dari pathRef saat idle (FCP/LCP tidak menggantung ingest). */
      if (document.readyState === "complete") {
        runIdle();
      } else if (!loadIdleHooked) {
        loadIdleHooked = true;
        window.addEventListener("load", () => runIdle(), { once: true });
      }
    };

    const applyPath = () => {
      const path = readPathnameFromBrowser();

      if (isAdminPath(path)) {
        lastGtmPath = null;
        const prev = pathRef.current;
        if (prev && !isAdminPath(prev)) {
          endPage(prev);
        }
        pathRef.current = "";
        if (detachDomListeners) {
          detachDomListeners();
          detachDomListeners = undefined;
        }
        clearHeartbeat();
        visibleSinceRef.current = null;
        return;
      }

      const prev = pathRef.current;
      if (prev && prev !== path) {
        endPage(prev);
      }
      if (detachDomListeners) {
        detachDomListeners();
      }
      pathRef.current = path;
      if (lastGtmPath !== path) {
        lastGtmPath = path;
        pushGtmVirtualPageView(path);
      }
      scheduleDeferredStartPage();
      visibleSinceRef.current = Date.now();
      detachDomListeners = attachListenersForPath();
    };

    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    const scheduleApply = () => {
      queueMicrotask(() => {
        applyPath();
      });
    };

    history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
      const ret = origPush(data, unused, url);
      scheduleApply();
      return ret;
    };
    history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
      const ret = origReplace(data, unused, url);
      scheduleApply();
      return ret;
    };

    window.addEventListener("popstate", scheduleApply);

    applyPath();

    return () => {
      window.removeEventListener("popstate", scheduleApply);
      history.pushState = origPush;
      history.replaceState = origReplace;
      if (detachDomListeners) {
        detachDomListeners();
      }
      clearHeartbeat();
    };
  }, []);

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
      const el = target.closest(
        'a[href],button,input[type="submit"],input[type="button"],input[type="reset"],[role="button"],[data-track],[data-track-click],[data-gtm],[data-gtm-click]',
      );
      if (!el) {
        return;
      }
      if (el.closest("[data-analytics-ignore]")) {
        return;
      }

      const trackKey =
        el.getAttribute("data-track") ||
        el.getAttribute("data-track-click") ||
        el.getAttribute("data-gtm-click");
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

      pushGtmUserInteraction({
        page_path: path,
        element_tag: tag,
        element_label: labelForGtm(el),
        track_key: trackKey,
        link_url: targetUrl,
        is_internal_link: isInternal,
      });

      void sendAnalyticsBatch([evt], { deferNetwork: true });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const onSubmit = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      const path = readPathnameFromBrowser();
      if (isAdminPath(path)) {
        return;
      }
      if (form.closest("[data-analytics-ignore]")) {
        return;
      }
      pushGtmFormSubmit({
        page_path: path,
        form_id: form.id || null,
        action: form.getAttribute("action"),
      });
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  return (
    <>
      <Toaster position="top-center" richColors />
      <Outlet />
    </>
  );
}
