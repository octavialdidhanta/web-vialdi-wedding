import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDeleteAgencyPackage, adminListAgencyPackages } from "@/agency/agencyPackages";
import { adminDeletePackage, adminListPackages } from "@/blog/weddingPackages";
import { useIsWeddingSite } from "@/site/siteVariant";
import { Button } from "@/share/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/share/ui/alert-dialog";
import { toast } from "sonner";

export function AdminPackagesListPage() {
  const qc = useQueryClient();
  const isWeddingSite = useIsWeddingSite();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin", "packages", "list"],
    queryFn: isWeddingSite ? adminListPackages : adminListAgencyPackages,
  });
  const deleteRow = rows.find((r) => r.id === deleteId) ?? null;

  const del = useMutation({
    mutationFn: isWeddingSite ? adminDeletePackage : adminDeleteAgencyPackage,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "packages"] });
      await qc.invalidateQueries({
        queryKey: [isWeddingSite ? "wedding-packages-carousel" : "agency-packages-carousel"],
      });
      toast.success("Paket dihapus");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function kindLabel(badgeLabel: string): string {
    if (isWeddingSite) return badgeLabel.trim() || "-";
    const s = badgeLabel.trim().toLowerCase();
    if (s.includes("ads")) return "Paket Ads";
    if (s.includes("landing")) return "Paket Landing Page";
    if (s.includes("content")) return "Paket Content";
    if (s.includes("full funnel")) return "Paket Full Funnel";
    return badgeLabel.trim() || "-";
  }

  return (
    <div className="p-6 md:p-8">
      <div className="sticky top-0 z-10 -mx-6 flex flex-col gap-4 border-b border-border/60 bg-muted/25 px-6 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-muted/20 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">Paket</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isWeddingSite
                ? "Kelola kartu Paket Wedding (Supabase). Hanya yang terbit yang tampil di beranda."
                : "Kelola kartu Paket Ads (Supabase). Hanya yang terbit yang tampil di beranda."}
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/packages/new">Paket baru</Link>
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{(error as Error).message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Urutan</th>
              <th className="px-4 py-3 font-medium">Jenis</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Judul</th>
              <th className="px-4 py-3 font-medium">Harga</th>
              <th className="px-4 py-3 font-medium">Terbit</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Memuat…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada paket. Jalankan migrasi Supabase atau buat paket baru.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 tabular-nums">{p.sort_order}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-border/60 bg-muted/30 px-2 py-1 text-[0.7rem] font-semibold text-navy">
                      {kindLabel(p.badge_label)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3 font-medium text-navy">{p.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start leading-tight">
                      {p.strikethrough_price ? (
                        <span className="text-xs text-muted-foreground line-through">{p.strikethrough_price}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      <span className="font-semibold text-navy">{p.price}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.is_published ? "Ya" : "Tidak"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/packages/${p.id}`}>Edit</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(p.id)}
                      disabled={del.isPending}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus paket?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak bisa diurungkan.{" "}
              {deleteRow ? (
                <>
                  Paket <span className="font-mono">{deleteRow.slug}</span> akan dihapus.
                </>
              ) : null}{" "}
              Pastikan paket tidak dipakai di artikel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={() => {
                if (deleteId) {
                  void del.mutateAsync(deleteId);
                }
              }}
            >
              {del.isPending ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
