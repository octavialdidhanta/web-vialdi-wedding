import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AdminSidebar } from "@/admin/components/AdminSidebar";
import { useAdminAuth } from "@/admin/adminAuthContext";

export function AdminLayout() {
  const { session, isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Memuat sesi…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  return (
    <div className="flex h-dvh min-h-0 bg-muted/25">
      <AdminSidebar />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth [scrollbar-gutter:stable]">
        <Outlet />
      </div>
    </div>
  );
}
