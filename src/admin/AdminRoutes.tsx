import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthProvider } from "@/admin/adminAuthContext";
import { AdminLayout } from "@/admin/AdminLayout";
import { AdminLoginPage } from "@/admin/pages/AdminLoginPage";
import { AdminForbiddenPage } from "@/admin/pages/AdminForbiddenPage";

const AdminDashboardPage = lazy(() =>
  import("@/admin/pages/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminPostsListPage = lazy(() =>
  import("@/admin/pages/AdminPostsListPage").then((m) => ({ default: m.AdminPostsListPage })),
);
const AdminPostEditorPage = lazy(() =>
  import("@/admin/pages/AdminPostEditorPage").then((m) => ({ default: m.AdminPostEditorPage })),
);
const AdminPackagesListPage = lazy(() =>
  import("@/admin/pages/AdminPackagesListPage").then((m) => ({ default: m.AdminPackagesListPage })),
);
const AdminPackageEditorPage = lazy(() =>
  import("@/admin/pages/AdminPackageEditorPage").then((m) => ({
    default: m.AdminPackageEditorPage,
  })),
);
const AdminShortLinksPage = lazy(() =>
  import("@/admin/pages/AdminShortLinksPage").then((m) => ({ default: m.AdminShortLinksPage })),
);
const AdminFloatingWhatsappPage = lazy(() =>
  import("@/admin/pages/AdminFloatingWhatsappPage").then((m) => ({
    default: m.AdminFloatingWhatsappPage,
  })),
);

function AdminSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Memuat…
    </div>
  );
}

export function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="forbidden" element={<AdminForbiddenPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminDashboardPage />
              </Suspense>
            }
          />
          <Route
            path="posts"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminPostsListPage />
              </Suspense>
            }
          />
          <Route
            path="posts/new"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminPostEditorPage />
              </Suspense>
            }
          />
          <Route
            path="posts/:id"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminPostEditorPage />
              </Suspense>
            }
          />
          <Route
            path="packages"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminPackagesListPage />
              </Suspense>
            }
          />
          <Route
            path="packages/new"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminPackageEditorPage />
              </Suspense>
            }
          />
          <Route
            path="packages/:id"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminPackageEditorPage />
              </Suspense>
            }
          />
          <Route
            path="links"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminShortLinksPage />
              </Suspense>
            }
          />
          <Route
            path="whatsapp"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminFloatingWhatsappPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}
