import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { ShortLinkOutboundRedirect } from "@/share/ShortLinkOutboundRedirect";

function MetaPixelRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      loadMetaPixel?: () => void;
      fbq?: (...args: unknown[]) => void;
      __fbqLastTrackedUrl?: string | null;
      __fbqInitialPageViewTracked?: boolean;
    };

    const url = location.pathname + location.search + location.hash;

    // Ensure the Pixel library is available for all visitors (retargeting).
    w.loadMetaPixel?.();

    // Track PageView on SPA navigations (and avoid duplicates on first load).
    if (typeof w.fbq === "function") {
      if (w.__fbqLastTrackedUrl !== url) {
        w.fbq("track", "PageView");
        w.__fbqLastTrackedUrl = url;
        w.__fbqInitialPageViewTracked = true;
      }
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
}

function DeferredAnalyticsLayout() {
  const [Layout, setLayout] = useState<null | ComponentType>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      import("@/analytics/AnalyticsProvider")
        .then((m) => {
          if (!cancelled) setLayout(() => m.AnalyticsProvider);
        })
        .catch(() => {
          // If analytics fails to load, keep the app usable.
          if (!cancelled) setLayout(null);
        });
    };

    if (typeof window === "undefined") return;

    /**
     * IMPORTANT: jangan ikut di critical request chain PSI/Lighthouse.
     * Tunggu `load` event, baru schedule idle import.
     */
    const schedule = () => {
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(load, { timeout: 12_000 });
        return;
      }
      window.setTimeout(load, 4000);
    };

    if (document.readyState === "complete") {
      schedule();
      return () => {
        cancelled = true;
      };
    }

    window.addEventListener("load", schedule, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
    };
  }, []);

  if (!Layout) {
    return <Outlet />;
  }

  return <Layout />;
}

const QueryRoutesLayout = lazy(() =>
  import("@/query/QueryRoutesLayout").then((m) => ({ default: m.QueryRoutesLayout })),
);
const HomePage = lazy(() => import("@/home/HomePage").then((m) => ({ default: m.HomePage })));
const AboutUsPage = lazy(() =>
  import("@/about-us/AboutUsPage").then((m) => ({ default: m.AboutUsPage })),
);
const AdminRoutes = lazy(() =>
  import("@/admin/AdminRoutes").then((m) => ({ default: m.AdminRoutes })),
);
const ContactPage = lazy(() =>
  import("@/contact/ContactPage").then((m) => ({ default: m.ContactPage })),
);
const ThankYouPage = lazy(() =>
  import("@/contact/ThankYouPage").then((m) => ({ default: m.ThankYouPage })),
);
const OurServicesPage = lazy(() =>
  import("@/service/OurServicesPage").then((m) => ({ default: m.OurServicesPage })),
);
const BlogPage = lazy(() => import("@/blog/BlogPage").then((m) => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() =>
  import("@/blog/BlogPostPage").then((m) => ({ default: m.BlogPostPage })),
);
const TermsPage = lazy(() =>
  import("@/term&condition/TermsPage").then((m) => ({ default: m.TermsPage })),
);

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MetaPixelRouteTracker />
      <Suspense fallback={null}>
        <Routes>
          <Route element={<DeferredAnalyticsLayout />}>
            <Route path="/l/:slug" element={<ShortLinkOutboundRedirect />} />
            <Route path="/service" element={<OurServicesPage />} />
            <Route element={<QueryRoutesLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
            </Route>
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about-us" element={<AboutUsPage />} />
            <Route path="/terms-and-conditions" element={<TermsPage />} />
            <Route path="/thank-you-page" element={<ThankYouPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
