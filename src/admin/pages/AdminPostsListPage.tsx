import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDeletePost, adminFetchPosts } from "@/blog/agencySupabaseBlog";
import type { PostStatus } from "@/blog/types";
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

export function AdminPostsListPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: adminFetchPosts,
  });

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return posts;
    }
    return posts.filter((p) => p.status === statusFilter);
  }, [posts, statusFilter]);

  const del = useMutation({
    mutationFn: adminDeletePost,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      toast.success("Post dihapus");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-8">
      <div className="sticky top-0 z-10 -mx-6 flex flex-col gap-4 border-b border-border/60 bg-muted/25 px-6 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-muted/20 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">Posts</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola artikel blog.</p>
          </div>
          <Button asChild>
            <Link to="/admin/posts/new">Artikel baru</Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "draft", "scheduled", "published", "archived"] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Semua" : s}
            </Button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{(error as Error).message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Judul</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Terbit</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-muted-foreground">
                  Memuat…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-muted-foreground">
                  Tidak ada post.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/posts/${p.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.status}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("id-ID") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteId(p.id)}
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
            <AlertDialogTitle>Hapus post?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && del.mutate(deleteId)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
