import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteMarketingShortLink,
  adminInsertMarketingShortLink,
  adminListMarketingShortLinks,
  adminUpdateMarketingShortLink,
  buildLongUrlPreview,
  generateRandomSlug,
  isValidPathname,
  shortLinkPublicUrl,
  type MarketingShortLinkInput,
  type MarketingShortLinkRow,
} from "@/admin/lib/marketingShortLinks";
import { Button } from "@/share/ui/button";
import { Input } from "@/share/ui/input";
import { Label } from "@/share/ui/label";
import { Switch } from "@/share/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/share/ui/dialog";
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

const emptyForm: MarketingShortLinkInput = {
  slug: "",
  site_origin: "",
  pathname: "/",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  active: true,
};

/** Pintasan path internal (selaras route publik di App). */
const QUICK_PATHS: { label: string; path: string }[] = [
  { label: "Beranda", path: "/" },
  { label: "Layanan", path: "/service" },
  { label: "Kontak", path: "/contact" },
  { label: "Tentang kami", path: "/about-us" },
  { label: "Blog", path: "/blog" },
  { label: "Syarat & ketentuan", path: "/terms-and-conditions" },
];

function utmSummary(r: MarketingShortLinkRow): string {
  const parts = [r.utm_source, r.utm_medium, r.utm_campaign, r.utm_content, r.utm_term].filter(
    Boolean,
  );
  if (parts.length === 0) return "—";
  const s = parts.join(" · ");
  return s.length > 48 ? `${s.slice(0, 45)}…` : s;
}

export function AdminShortLinksPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingShortLinkRow | null>(null);
  const [form, setForm] = useState<MarketingShortLinkInput>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  /** Hanya untuk tautan baru: 1 = halaman + UTM, 2 = slug pendek. */
  const [createStep, setCreateStep] = useState<1 | 2>(1);

  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "marketing-short-links"],
    queryFn: adminListMarketingShortLinks,
  });
  const deleteRow = rows.find((r) => r.id === deleteId) ?? null;

  useEffect(() => {
    if (!dialogOpen) return;
    if (editing) {
      setForm({
        slug: editing.slug,
        site_origin: editing.site_origin ?? "",
        pathname: editing.pathname,
        utm_source: editing.utm_source ?? "",
        utm_medium: editing.utm_medium ?? "",
        utm_campaign: editing.utm_campaign ?? "",
        utm_content: editing.utm_content ?? "",
        utm_term: editing.utm_term ?? "",
        active: editing.active,
      });
    } else {
      setForm({
        ...emptyForm,
        slug: generateRandomSlug(8),
        site_origin: (import.meta.env.VITE_PUBLIC_SITE_ORIGIN as string | undefined)?.trim() || "",
      });
      setCreateStep(1);
    }
  }, [dialogOpen, editing]);

  const longUrlPreview = useMemo(() => buildLongUrlPreview(form), [form]);

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        await adminUpdateMarketingShortLink(editing.id, form);
      } else {
        await adminInsertMarketingShortLink(form);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "marketing-short-links"] });
      toast.success(editing ? "Link diperbarui" : "Link dibuat");
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: adminDeleteMarketingShortLink,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "marketing-short-links"] });
      toast.success("Link dihapus");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-8">
      <div className="sticky top-0 z-10 -mx-6 flex flex-col gap-4 border-b border-border/60 bg-muted/25 px-6 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-muted/20 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
              <Link2 className="h-7 w-7 shrink-0" aria-hidden />
              Short link &amp; UTM
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Susun dulu halaman &amp; UTM (URL panjang), lalu slug pendek. Redirect server-side
              (302). Salin{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">/l/…</code> untuk
              bio atau iklan.
            </p>
            {import.meta.env.VITE_PUBLIC_SITE_ORIGIN ? null : (
              <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                Set <code className="font-mono">VITE_PUBLIC_SITE_ORIGIN</code> (mis.{" "}
                <code className="font-mono">https://jasafotowedding.com</code>) agar tombol Salin
                memakai domain production, bukan origin dev.
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            Link baru
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{(error as Error).message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Path</th>
              <th className="px-4 py-3 font-medium">UTM</th>
              <th className="px-4 py-3 font-medium">Aktif</th>
              <th className="px-4 py-3 font-medium tabular-nums">Klik</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Memuat…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada short link. Pastikan migrasi Supabase sudah dijalankan.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-navy">{r.slug}</td>
                  <td
                    className="max-w-[140px] truncate px-4 py-3 font-mono text-xs"
                    title={r.pathname}
                  >
                    {r.pathname}
                  </td>
                  <td
                    className="max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground"
                    title={utmSummary(r)}
                  >
                    {utmSummary(r)}
                  </td>
                  <td className="px-4 py-3">{r.active ? "Ya" : "Tidak"}</td>
                  <td className="px-4 py-3 tabular-nums">{r.click_count}</td>
                  <td className="space-x-1 px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(shortLinkPublicUrl(r.slug, r.site_origin));
                          toast.success("URL disalin");
                        } catch {
                          toast.error("Gagal menyalin");
                        }
                      }}
                    >
                      Salin
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(r);
                        setDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(r.id)}
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditing(null);
            setCreateStep(1);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit short link" : "Short link baru"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Ubah halaman, UTM, atau slug. Pathname harus internal; tidak boleh /admin."
                : "Langkah 1: pilih domain + halaman & isi UTM. Langkah 2: slug pendek."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            {(editing || createStep === 1) && (
              <section className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                    aria-hidden
                  >
                    1
                  </span>
                  Halaman &amp; UTM (link panjang)
                </div>
                <p className="text-xs text-muted-foreground">
                  Pilih path atau ketik manual. Path harus diawali{" "}
                  <code className="rounded bg-muted px-0.5 font-mono text-[10px]">/</code>, bukan{" "}
                  <code className="rounded bg-muted px-0.5 font-mono text-[10px]">/admin</code>.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="msl-origin">Domain</Label>
                  <Input
                    id="msl-origin"
                    value={form.site_origin ?? ""}
                    readOnly
                    disabled
                    className="font-mono text-sm"
                    placeholder="https://vialdi.id"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Domain dikunci dari konfigurasi aplikasi (
                    <code className="font-mono">VITE_PUBLIC_SITE_ORIGIN</code>) agar short link di project ini
                    selalu mengarah ke domain yang benar.
                  </p>
                </div>
                <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {QUICK_PATHS.map((q) => (
                    <Button
                      key={q.path}
                      type="button"
                      size="sm"
                      variant={form.pathname === q.path ? "default" : "outline"}
                      className="h-8 shrink-0 text-xs"
                      onClick={() => setForm((f) => ({ ...f, pathname: q.path }))}
                    >
                      {q.label}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="msl-path">Pathname</Label>
                  <Input
                    id="msl-path"
                    value={form.pathname}
                    onChange={(e) => setForm((f) => ({ ...f, pathname: e.target.value }))}
                    className="font-mono text-sm"
                    placeholder="/"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="msl-us">utm_source</Label>
                    <Input
                      id="msl-us"
                      value={form.utm_source ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, utm_source: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="msl-um">utm_medium</Label>
                    <Input
                      id="msl-um"
                      value={form.utm_medium ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, utm_medium: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="msl-uc">utm_campaign</Label>
                    <Input
                      id="msl-uc"
                      value={form.utm_campaign ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, utm_campaign: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="msl-uco">utm_content</Label>
                    <Input
                      id="msl-uco"
                      value={form.utm_content ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, utm_content: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="msl-ut">utm_term</Label>
                    <Input
                      id="msl-ut"
                      value={form.utm_term ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, utm_term: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Pratinjau URL setelah klik short link
                  </Label>
                  <div className="break-all rounded-md border border-border bg-background px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
                    {longUrlPreview}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit text-xs"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(longUrlPreview);
                        toast.success("URL panjang disalin");
                      } catch {
                        toast.error("Gagal menyalin");
                      }
                    }}
                  >
                    Salin URL panjang
                  </Button>
                </div>
              </section>
            )}

            {(editing || createStep === 2) && (
              <section className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                    aria-hidden
                  >
                    2
                  </span>
                  Short link (slug)
                </div>
                <div className="grid gap-2">
                  <div className="flex items-end justify-between gap-2">
                    <Label htmlFor="msl-slug">Slug</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs"
                      onClick={() => setForm((f) => ({ ...f, slug: generateRandomSlug(8) }))}
                    >
                      Acak slug
                    </Button>
                  </div>
                  <Input
                    id="msl-slug"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    URL pendek:{" "}
                    <span className="font-mono text-foreground">
                      {shortLinkPublicUrl(form.slug || "slug", form.site_origin ?? null)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <Label htmlFor="msl-active" className="cursor-pointer">
                    Aktif
                  </Label>
                  <Switch
                    id="msl-active"
                    checked={form.active}
                    onCheckedChange={(active) => setForm((f) => ({ ...f, active }))}
                  />
                </div>
              </section>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {!editing && createStep === 2 ? (
              <Button type="button" variant="outline" onClick={() => setCreateStep(1)}>
                Kembali
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            {!editing && createStep === 1 ? (
              <Button
                type="button"
                onClick={() => {
                  if (!isValidPathname(form.pathname)) {
                    toast.error("Pathname tidak valid (internal, bukan /admin).");
                    return;
                  }
                  setCreateStep(2);
                }}
              >
                Lanjut ke short link
              </Button>
            ) : (
              <Button
                type="button"
                disabled={save.isPending}
                onClick={() => void save.mutateAsync()}
              >
                {save.isPending ? "Menyimpan…" : "Simpan"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus short link?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak bisa diurungkan.
              {deleteRow ? (
                <>
                  {" "}
                  <span className="font-mono">{deleteRow.slug}</span> akan dihapus.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={() => {
                if (deleteId) void del.mutateAsync(deleteId);
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
