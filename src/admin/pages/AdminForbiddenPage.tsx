import { Link, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/admin/adminAuthContext";
import { Button } from "@/share/ui/button";
import { supabase } from "@/share/supabaseClient";

export function AdminForbiddenPage() {
  const { session, loading } = useAdminAuth();

  if (!loading && !session) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30 p-6 text-center">
      <h1 className="text-2xl font-bold text-navy">Akses ditolak</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Akun Anda sudah masuk tetapi tidak ada di daftar{" "}
        <code className="rounded bg-muted px-1">cms_admins</code>. Hubungi pemilik proyek untuk
        menambahkan <code className="rounded bg-muted px-1">user_id</code> Anda.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => void supabase.auth.signOut()}>
          Keluar
        </Button>
        <Button asChild>
          <Link to="/">Ke beranda</Link>
        </Button>
      </div>
    </div>
  );
}
