import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import type { JSONContent } from "@tiptap/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminFetchPost,
  adminFetchPosts,
  adminInsertPost,
  adminListCategories,
  adminListTags,
  adminReplacePostTags,
  adminUpdatePost,
  adminUpsertCategory,
  adminDeletePost,
  uploadBlogImage,
  type AdminPostPayload,
} from "@/blog/supabaseBlog";
import { mergePostTargets } from "@/admin/lib/siteNavLinks";
import { useAdminAuth } from "@/admin/adminAuthContext";
import { TiptapEditor } from "@/admin/components/TiptapEditor";
import { serializeEditorDocument } from "@/admin/lib/serializePostBody";
import { normalizePostBodyJson } from "@/admin/lib/htmlToTiptapDoc";
import type { BlogAccent, PostStatus } from "@/blog/types";
import { Button } from "@/share/ui/button";
import { Input } from "@/share/ui/input";
import { Label } from "@/share/ui/label";
import { Textarea } from "@/share/ui/textarea";
import { Checkbox } from "@/share/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/share/ui/select";
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

function slugifyTitle(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

const emptyDoc: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

const accents: BlogAccent[] = ["navy", "orange", "emerald", "violet"];

function toIsoOrNull(v: string | null): string | null {
  if (!v?.trim()) {
    return null;
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

type BuildPayloadOpts = {
  /** Saat Publish dengan waktu Terbit di masa depan → simpan sebagai scheduled. */
  scheduledAtOverride?: string | null;
};

export function AdminPostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isNew = location.pathname.endsWith("/new");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAdminAuth();

  const [slugTouched, setSlugTouched] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [featured, setFeatured] = useState(false);
  const [accent, setAccent] = useState<BlogAccent>("navy");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [bodyJson, setBodyJson] = useState<JSONContent | null>(emptyDoc);
  const [bodyHtmlFallback, setBodyHtmlFallback] = useState("");
  const [editorSeed, setEditorSeed] = useState(0);
  const lastHydratedKeyRef = useRef<string | null>(null);
  const [publishedAtLocal, setPublishedAtLocal] = useState("");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: post, isLoading: loadingPost } = useQuery({
    queryKey: ["admin", "post", id],
    queryFn: () => adminFetchPost(id!),
    enabled: Boolean(!isNew && id),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminListCategories,
  });

  const { data: adminPostsForLinks = [] } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: adminFetchPosts,
  });

  const internalLinkTargets = useMemo(
    () =>
      mergePostTargets(adminPostsForLinks.map((p) => ({ id: p.id, title: p.title, slug: p.slug }))),
    [adminPostsForLinks],
  );

  useQuery({ queryKey: ["admin", "tags"], queryFn: adminListTags });

  useEffect(() => {
    if (!post) {
      return;
    }
    const hydrateKey = `${post.id}|${post.updated_at ?? ""}`;
    if (lastHydratedKeyRef.current === hydrateKey) {
      return;
    }
    lastHydratedKeyRef.current = hydrateKey;
    setTitle(post.title);
    setSlug(post.slug);
    setSlugTouched(true);
    setExcerpt(post.excerpt);
    setStatus(post.status);
    setFeatured(post.featured);
    setAccent(post.accent);
    setCategoryId(post.category_id);
    const tagNames =
      post.post_tags
        ?.map((x) => x?.blog_tags?.name)
        .filter((n): n is string => Boolean(n))
        .sort() ?? [];
    setTagsInput(tagNames.join(", "));
    setCoverPath(post.cover_image_path);
    setCoverUrl(post.cover_image_url);
    setBodyJson(normalizePostBodyJson(post.body_json, post.body_html ?? ""));
    setBodyHtmlFallback(post.body_html ?? "");
    setPublishedAtLocal(post.published_at ? post.published_at.slice(0, 16) : "");
    setScheduledAtLocal(post.scheduled_at ? post.scheduled_at.slice(0, 16) : "");
    // Tiptap only reads `content` on mount. Force a remount after we hydrate body JSON from DB.
    setEditorSeed((n) => n + 1);
  }, [post]);

  useEffect(() => {
    if (slugTouched || !title.trim()) {
      return;
    }
    setSlug(slugifyTitle(title));
  }, [title, slugTouched]);

  const editorMountKey = isNew
    ? "new"
    : `${post?.id ?? id}-${post?.updated_at ?? "loading"}-${editorSeed}`;

  function buildPayload(nextStatus: PostStatus, opts?: BuildPayloadOpts): AdminPostPayload {
    const ser = serializeEditorDocument(bodyJson);
    let published_at: string | null = null;
    let scheduled_at: string | null = null;

    if (nextStatus === "draft") {
      published_at = null;
      scheduled_at = null;
    } else if (nextStatus === "published") {
      const now = new Date();
      const pub = toIsoOrNull(publishedAtLocal);
      if (!pub || new Date(pub) > now) {
        published_at = now.toISOString();
      } else {
        published_at = pub;
      }
      scheduled_at = null;
    } else if (nextStatus === "scheduled") {
      published_at = null;
      scheduled_at = opts?.scheduledAtOverride ?? toIsoOrNull(scheduledAtLocal);
    } else if (nextStatus === "archived") {
      published_at = null;
      scheduled_at = null;
    }

    return {
      slug: slug.trim(),
      title: title.trim(),
      excerpt: excerpt.trim(),
      status: nextStatus,
      featured,
      accent,
      cover_image_path: coverPath,
      cover_image_url: coverUrl?.trim() || null,
      body_json: bodyJson ?? emptyDoc,
      body_html: ser.body_html,
      toc_json: ser.toc_json,
      read_time_minutes: ser.read_time_minutes,
      category_id: categoryId,
      published_at,
      scheduled_at,
      updated_by: user?.id ?? null,
    };
  }

  const saveMutation = useMutation({
    mutationFn: async (mode: "draft" | "publish" | "schedule" | "archive") => {
      if (!user?.id) {
        throw new Error("Tidak ada pengguna");
      }
      const tagNames = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      let nextStatus: PostStatus = status;
      let scheduleFromPublish: string | null = null;

      if (mode === "draft") {
        nextStatus = "draft";
      } else if (mode === "publish") {
        const pub = toIsoOrNull(publishedAtLocal);
        if (pub && new Date(pub).getTime() > Date.now()) {
          nextStatus = "scheduled";
          scheduleFromPublish = pub;
          toast.message(
            "Waktu Terbit di masa depan — artikel disimpan sebagai terjadwal dan akan tampil di situs saat waktunya tiba.",
          );
        } else {
          nextStatus = "published";
        }
      } else if (mode === "schedule") {
        nextStatus = "scheduled";
      } else if (mode === "archive") {
        nextStatus = "archived";
      }

      if (mode === "schedule") {
        const sch = toIsoOrNull(scheduledAtLocal);
        if (!sch) {
          throw new Error(
            "Isi tanggal dan jam di kolom Terjadwal (lokal) sebelum menyimpan terjadwal.",
          );
        }
        if (new Date(sch).getTime() <= Date.now()) {
          throw new Error("Waktu terjadwal harus di masa depan.");
        }
      }

      const payload = buildPayload(
        nextStatus,
        scheduleFromPublish ? { scheduledAtOverride: scheduleFromPublish } : undefined,
      );

      if (nextStatus === "scheduled" && !payload.scheduled_at) {
        throw new Error("Tanggal terjadwal tidak valid.");
      }

      setStatus(nextStatus);
      if (nextStatus === "published") {
        setPublishedAtLocal(payload.published_at ? payload.published_at.slice(0, 16) : "");
        setScheduledAtLocal("");
      }
      if (nextStatus === "scheduled") {
        if (scheduleFromPublish) {
          setScheduledAtLocal(publishedAtLocal);
          setPublishedAtLocal("");
        }
      }
      if (nextStatus === "draft") {
        setPublishedAtLocal("");
        setScheduledAtLocal("");
      }

      if (isNew) {
        const newId = await adminInsertPost(payload, user.id);
        await adminReplacePostTags(newId, tagNames);
        return newId;
      }
      if (!id) {
        throw new Error("Missing id");
      }
      await adminUpdatePost(id, payload);
      await adminReplacePostTags(id, tagNames);
      return id;
    },
    onSuccess: async (savedId) => {
      await qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      await qc.invalidateQueries({ queryKey: ["admin", "post", savedId] });
      await qc.invalidateQueries({ queryKey: ["blog"] });
      toast.success("Tersimpan");
      if (isNew) {
        navigate(`/admin/posts/${savedId}`, { replace: true });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      return;
    }
    const s = slugifyTitle(name);
    try {
      const cid = await adminUpsertCategory(s || "kategori", name);
      setCategoryId(cid);
      setNewCategoryName("");
      await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Kategori dibuat");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) {
      return;
    }
    try {
      const path = await uploadBlogImage(file, user.id);
      setCoverPath(path);
      setCoverUrl(null);
      toast.success("Gambar diunggah");
    } catch (err) {
      toast.error((err as Error).message);
    }
    e.target.value = "";
  }

  const runSave = async (mode: "draft" | "publish" | "schedule" | "archive") => {
    setSaving(true);
    try {
      await saveMutation.mutateAsync(mode);
    } finally {
      setSaving(false);
    }
  };

  const del = useMutation({
    mutationFn: () => (id ? adminDeletePost(id) : Promise.resolve()),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      await qc.invalidateQueries({ queryKey: ["blog"] });
      toast.success("Dihapus");
      navigate("/admin/posts");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pageTitle = useMemo(() => (isNew ? "Post baru" : "Edit post"), [isNew]);

  if (!isNew && id && loadingPost) {
    return <div className="p-8 text-sm text-muted-foreground">Memuat artikel…</div>;
  }

  if (!isNew && id && !loadingPost && !post) {
    return (
      <div className="p-8">
        <p className="text-destructive">Post tidak ditemukan.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/admin/posts">Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" asChild>
            <Link to="/admin/posts">← Daftar post</Link>
          </Button>
          <h1 className="text-2xl font-bold text-navy">{pageTitle}</h1>
        </div>
        {!isNew && post ? (
          post.status === "published" ||
          (post.status === "scheduled" &&
            post.scheduled_at &&
            new Date(post.scheduled_at).getTime() <= Date.now()) ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                Lihat di situs
              </a>
            </Button>
          ) : null
        ) : null}
      </div>

      <div className="mx-auto max-w-[min(92rem,calc(100vw-1.5rem))]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(22rem,100%)] lg:items-start">
          <div className="min-w-0 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Ringkasan (excerpt)</Label>
              <Textarea
                id="excerpt"
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Isi artikel</Label>
              <TiptapEditor
                mountKey={editorMountKey}
                initialJson={bodyJson}
                initialHtml={bodyHtmlFallback}
                onChangeJson={setBodyJson}
                disabled={saving}
                internalLinkTargets={internalLinkTargets}
                uploadUserId={user?.id ?? null}
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-6">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => void runSave("draft")}
              >
                Simpan draft
              </Button>
              <Button type="button" disabled={saving} onClick={() => void runSave("publish")}>
                Publish
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void runSave("schedule")}
              >
                Simpan terjadwal
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void runSave("archive")}
              >
                Arsipkan
              </Button>
              {!isNew ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="ml-auto"
                  onClick={() => setShowDelete(true)}
                >
                  Hapus
                </Button>
              ) : null}
            </div>
          </div>

          <aside className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Publikasi
              </h2>
              <div className="mt-3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug URL</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium capitalize text-navy">
                    {status}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Diubah lewat tombol Simpan draft / Publish / Terjadwal / Arsip.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Metadata
              </h2>
              <div className="mt-3 space-y-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={categoryId ?? "__none"}
                    onValueChange={(v) => setCategoryId(v === "__none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">—</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Nama kategori baru"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void onCreateCategory()}
                    >
                      Tambah
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tag (pisahkan koma)</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="feat"
                    checked={featured}
                    onCheckedChange={(c) => setFeatured(c === true)}
                  />
                  <Label htmlFor="feat">Featured</Label>
                </div>
                <div className="space-y-2">
                  <Label>Aksen kartu</Label>
                  <Select value={accent} onValueChange={(v) => setAccent(v as BlogAccent)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accents.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sampul & jadwal
              </h2>
              <div className="mt-3 space-y-4">
                <div className="space-y-2">
                  <Label>Gambar sampul (unggah)</Label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => void onCoverFile(e)}
                  />
                  {coverPath ? (
                    <p className="break-all text-xs text-muted-foreground">Path: {coverPath}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverUrl">URL gambar eksternal (opsional)</Label>
                  <Input
                    id="coverUrl"
                    value={coverUrl ?? ""}
                    onChange={(e) => setCoverUrl(e.target.value || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pub">Terbit (lokal, opsional)</Label>
                  <Input
                    id="pub"
                    type="datetime-local"
                    value={publishedAtLocal}
                    onChange={(e) => setPublishedAtLocal(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground leading-snug">
                    Saat <strong>Publish</strong>: kosongkan untuk terbit sekarang; isi tanggal
                    lampau untuk backdate; isi tanggal depan untuk menjadwalkan otomatis (status
                    terjadwal).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sch">Terjadwal (lokal)</Label>
                  <Input
                    id="sch"
                    type="datetime-local"
                    value={scheduledAtLocal}
                    onChange={(e) => setScheduledAtLocal(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground leading-snug">
                    Wajib diisi waktu <strong>masa depan</strong> lalu klik{" "}
                    <strong>Simpan terjadwal</strong>. Saat waktunya lewat, artikel tampil di blog
                    tanpa cron (pastikan migrasi RLS terbaru sudah dijalankan).
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus post ini?</AlertDialogTitle>
            <AlertDialogDescription>Data akan hilang dari database.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => del.mutate()}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
