import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnalyticsProvider } from "@/analytics/AnalyticsProvider";
import { AboutUsPage } from "@/about-us/AboutUsPage";
import { AdminRoutes } from "@/admin/AdminRoutes";
import { ContactPage } from "@/contact/ContactPage";
import { ThankYouPage } from "@/contact/ThankYouPage";
import { HomePage } from "@/home/HomePage";
import { OurServicesPage } from "@/service/OurServicesPage";
import { BlogPage } from "@/blog/BlogPage";
import { BlogPostPage } from "@/blog/BlogPostPage";
import { TermsPage } from "@/term&condition/TermsPage";

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
      <Routes>
        <Route element={<AnalyticsProvider />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/service" element={<OurServicesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
          <Route path="/thank-you-page" element={<ThankYouPage />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
