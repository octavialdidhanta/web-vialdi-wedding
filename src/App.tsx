import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnalyticsProvider } from "@/analytics/AnalyticsProvider";

const HomePage = lazy(() => import("@/home/HomePage").then((m) => ({ default: m.HomePage })));
const QueryRoutesLayout = lazy(() =>
  import("@/query/QueryRoutesLayout").then((m) => ({ default: m.QueryRoutesLayout })),
);
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
      <Suspense fallback={null}>
        <Routes>
          <Route element={<AnalyticsProvider />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/service" element={<OurServicesPage />} />
            <Route element={<QueryRoutesLayout />}>
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
