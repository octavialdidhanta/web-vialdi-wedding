import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminFetchAgencyPackage,
  adminUpsertAgencyPackage,
  agencyPackageSectionZ,
  uploadAgencyPackageMedia,
  type AgencyPackageSection,
  type AgencyPackageUpsert,
} from "@/agency/agencyPackages";
import { useAdminAuth } from "@/admin/adminAuthContext";
import { Button } from "@/share/ui/button";
import { Input } from "@/share/ui/input";
import { Label } from "@/share/ui/label";
import { Textarea } from "@/share/ui/textarea";
import { Checkbox } from "@/share/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/share/ui/select";

function ReqMark() {
  return (
    <span className="ml-1 text-destructive" aria-hidden="true">
      *
    </span>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function addDaysLocal(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const defaultSections: AgencyPackageSection[] = [
  {
    id: "detail",
    title: "Detail",
    intro: null,
    bullets: ["Isi poin paket di sini."],
  },
];

type SectionKind = "bullets" | "bullet_items" | "bonus_lines";

function kindOfSection(s: AgencyPackageSection): SectionKind {
  if (s.bullet_items?.length) return "bullet_items";
  if (s.bonus_lines?.length) return "bonus_lines";
  return "bullets";
}

function ensureIdLike(s: string): string {
  const v = s.trim();
  if (v) return v.slice(0, 48);
  return `sec-${Math.random().toString(36).slice(2, 8)}`;
}

export function AdminPackageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAdminAuth();
  const isNew = id === "new" || !id;

  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin", "packages", id],
    queryFn: () => adminFetchAgencyPackage(id!),
    enabled: Boolean(!isNew && id),
  });

  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [badgeLabel, setBadgeLabel] = useState("");
  const [title, setTitle] = useState("");
  const [packageLabel, setPackageLabel] = useState("");
  const [strikethroughPrice, setStrikethroughPrice] = useState("");
  const [price, setPrice] = useState("");
  const [promoMarquee, setPromoMarquee] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [footerExtraHtml, setFooterExtraHtml] = useState("");
  const [showBestSeller, setShowBestSeller] = useState(false);
  const [showFooterCountdown, setShowFooterCountdown] = useState(false);
  const [footerCountdownLabel, setFooterCountdownLabel] = useState("Promo Berakhir Dalam");
  const [promoCountdownLocal, setPromoCountdownLocal] = useState("");
  const [badgePath, setBadgePath] = useState<string | null>(null);
  const [badgeUrlOverride, setBadgeUrlOverride] = useState("");
  const [bestSellerPath, setBestSellerPath] = useState<string | null>(null);
  const [bestSellerUrlOverride, setBestSellerUrlOverride] = useState("");
  const [summary, setSummary] = useState("");
  const [spentMin, setSpentMin] = useState<number>(0);
  const [spentMax, setSpentMax] = useState<number>(0);
  const [spentCurrency, setSpentCurrency] = useState("IDR");
  const [spentPeriod, setSpentPeriod] = useState("per bulan");
  const [feePercent, setFeePercent] = useState<number>(10);
  const [sections, setSections] = useState<AgencyPackageSection[]>(defaultSections);
  const [advancedJsonOpen, setAdvancedJsonOpen] = useState(false);
  const [sectionsJson, setSectionsJson] = useState(() => JSON.stringify(defaultSections, null, 2));

  useEffect(() => {
    if (!existing) {
      return;
    }
    setSlug(existing.slug);
    setSortOrder(existing.sort_order);
    setIsPublished(existing.is_published);
    setBadgeLabel(existing.badge_label);
    setTitle(existing.title);
    setPackageLabel(existing.package_label);
    setSummary(existing.summary ?? "");
    setStrikethroughPrice(existing.strikethrough_price ?? "");
    setPrice(existing.price);
    setPromoMarquee(existing.promo_marquee_text ?? "");
    setFooterNote(existing.footer_note ?? "");
    setFooterExtraHtml(existing.footer_extra_html ?? "");
    setShowBestSeller(existing.show_best_seller);
    setShowFooterCountdown(existing.show_footer_countdown);
    setFooterCountdownLabel(existing.footer_countdown_label ?? "Promo Berakhir Dalam");
    setPromoCountdownLocal(toDatetimeLocalValue(existing.promo_countdown_ends_at));
    setBadgePath(existing.badge_image_path);
    setBadgeUrlOverride(existing.badge_image_url ?? "");
    setBestSellerPath(existing.best_seller_image_path);
    setBestSellerUrlOverride(existing.best_seller_image_url ?? "");
    setSpentMin(Number(existing.spent_budget_min ?? 0));
    setSpentMax(Number(existing.spent_budget_max ?? 0));
    setSpentCurrency(existing.spent_budget_currency ?? "IDR");
    setSpentPeriod(existing.spent_budget_period ?? "per bulan");
    setFeePercent(Number(existing.fee_percent ?? 10));
    setSections(existing.sections);
    setSectionsJson(JSON.stringify(existing.sections, null, 2));
  }, [existing]);

  useEffect(() => {
    if (!isNew || existing) {
      return;
    }
    setSections(defaultSections);
    setSectionsJson(JSON.stringify(defaultSections, null, 2));
    setSlug("paket-baru");
    setSortOrder(0);
    setIsPublished(false);
    setBadgeLabel("Paket Ads");
    setTitle("");
    setPackageLabel("");
    setSummary("");
    setPrice("");
    setSpentMin(0);
    setSpentMax(0);
    setSpentCurrency("IDR");
    setSpentPeriod("per bulan");
    setFeePercent(10);
  }, [isNew, existing]);

  useEffect(() => {
    if (title.trim() && !packageLabel.trim()) {
      setPackageLabel(title.trim());
    }
  }, [title, packageLabel]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("Tidak ada pengguna");
      }
      // Validate sections built from UI.
      const parsed: AgencyPackageSection[] = [];
      for (const item of sections) {
        const p = agencyPackageSectionZ.safeParse(item);
        if (!p.success) {
          throw new Error(`Section tidak valid: ${JSON.stringify(item)}`);
        }
        parsed.push(p.data);
      }

      const promoEndsAt = fromDatetimeLocalValue(promoCountdownLocal);
      if (showFooterCountdown && !promoEndsAt) {
        throw new Error("Pilih tanggal & jam akhir promo untuk hitung mundur.");
      }

      const payload: AgencyPackageUpsert = {
        id: isNew ? undefined : id,
        slug: slug.trim() || slugify(title) || "paket",
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        is_published: isPublished,
        badge_label: badgeLabel,
        title: title.trim(),
        package_label: packageLabel.trim() || title.trim(),
        summary: summary.trim() || null,
        strikethrough_price: strikethroughPrice.trim() || null,
        price: price.trim(),
        promo_marquee_text: promoMarquee.trim() || null,
        footer_note: footerNote.trim() || null,
        footer_extra_html: footerExtraHtml.trim() || null,
        show_best_seller: showBestSeller,
        best_seller_image_path: bestSellerPath,
        best_seller_image_url: bestSellerUrlOverride.trim() || null,
        badge_image_path: badgePath,
        badge_image_url: badgeUrlOverride.trim() || null,
        promo_countdown_ends_at: promoEndsAt,
        footer_countdown_label: footerCountdownLabel.trim() || null,
        show_footer_countdown: showFooterCountdown,
        spent_budget_min: Number.isFinite(spentMin) && spentMin > 0 ? spentMin : null,
        spent_budget_max: Number.isFinite(spentMax) && spentMax > 0 ? spentMax : null,
        spent_budget_currency: spentCurrency.trim() || "IDR",
        spent_budget_period: spentPeriod.trim() || "per bulan",
        fee_percent: Number.isFinite(feePercent) && feePercent > 0 ? feePercent : 10,
        sections: parsed,
      };
      return adminUpsertAgencyPackage(payload, user.id);
    },
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: ["admin", "packages"] });
      await qc.invalidateQueries({ queryKey: ["admin", "packages", row.id] });
      await qc.invalidateQueries({ queryKey: ["agency-packages-carousel"] });
      toast.success("Paket disimpan");
      if (isNew) {
        navigate(`/admin/packages/${row.id}`, { replace: true });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pageTitle = useMemo(() => (isNew ? "Paket baru" : "Edit paket"), [isNew]);

  useEffect(() => {
    // Keep advanced JSON view in sync with UI changes.
    setSectionsJson(JSON.stringify(sections, null, 2));
  }, [sections]);

  async function onUploadBadge(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user?.id) return;
    try {
      const path = await uploadAgencyPackageMedia(f, user.id);
      setBadgePath(path);
      toast.success("Gambar badge diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal unggah");
    }
  }

  async function onUploadBestSeller(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user?.id) return;
    try {
      const path = await uploadAgencyPackageMedia(f, user.id);
      setBestSellerPath(path);
      toast.success("Gambar best seller diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal unggah");
    }
  }

  if (!isNew && id && isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Memuat paket…</div>;
  }

  if (!isNew && id && !isLoading && !existing) {
    return (
      <div className="p-8">
        <p className="text-destructive">Paket tidak ditemukan.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/admin/packages">Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
            <Link to="/admin/packages">← Daftar paket</Link>
          </Button>
          <h1 className="text-2xl font-bold text-navy">{pageTitle}</h1>
        </div>
        <Button type="button" disabled={save.isPending} onClick={() => void save.mutateAsync()}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug
              <ReqMark />
            </Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort">Urutan (sort_order)</Label>
            <Input
              id="sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="pub"
            checked={isPublished}
            onCheckedChange={(v) => setIsPublished(v === true)}
          />
          <Label htmlFor="pub">Terbit (tampil di beranda & bisa dipilih embed)</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="badge">
            Label badge (pill)
            <ReqMark />
          </Label>
          <Select value={badgeLabel} onValueChange={(v) => setBadgeLabel(v)}>
            <SelectTrigger id="badge" className="w-full">
              <SelectValue placeholder="Pilih jenis paket" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paket Ads">Paket Ads</SelectItem>
              <SelectItem value="Paket Landing Page">Paket Landing Page</SelectItem>
              <SelectItem value="Paket Content">Paket Content</SelectItem>
              <SelectItem value="Paket Full Funnel">Paket Full Funnel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">
            Judul kartu
            <ReqMark />
          </Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plabel">
            Package label (CRM / WhatsApp)
            <ReqMark />
          </Label>
          <Input
            id="plabel"
            value={packageLabel}
            onChange={(e) => setPackageLabel(e.target.value)}
            maxLength={500}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Ringkasan (summary)</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="1 kalimat padat untuk menjelaskan paket."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="spentMin">Spent min (IDR)</Label>
            <Input id="spentMin" type="number" value={spentMin} onChange={(e) => setSpentMin(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spentMax">Spent max (IDR)</Label>
            <Input id="spentMax" type="number" value={spentMax} onChange={(e) => setSpentMax(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="spentCurrency">Mata uang</Label>
            <Input id="spentCurrency" value={spentCurrency} onChange={(e) => setSpentCurrency(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spentPeriod">Periode</Label>
            <Input id="spentPeriod" value={spentPeriod} onChange={(e) => setSpentPeriod(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feePercent">
            Fee percent (%)
            <ReqMark />
          </Label>
          <Input
            id="feePercent"
            type="number"
            value={feePercent}
            onChange={(e) => setFeePercent(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="strike">Harga coret</Label>
            <Input
              id="strike"
              value={strikethroughPrice}
              onChange={(e) => setStrikethroughPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">
              Label harga (mis. "Fee 10%")
              <ReqMark />
            </Label>
            <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marquee">Teks marquee (bawah harga)</Label>
          <Textarea id="marquee" rows={2} value={promoMarquee} onChange={(e) => setPromoMarquee(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fnote">Catatan footer</Label>
          <Textarea id="fnote" rows={2} value={footerNote} onChange={(e) => setFooterNote(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fextra">Footer HTML tambahan (opsional)</Label>
          <Textarea
            id="fextra"
            rows={2}
            value={footerExtraHtml}
            onChange={(e) => setFooterExtraHtml(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="bs"
            checked={showBestSeller}
            onCheckedChange={(v) => setShowBestSeller(v === true)}
          />
          <Label htmlFor="bs">Tampilkan best seller (gambar / lencana)</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="cd"
            checked={showFooterCountdown}
            onCheckedChange={(v) => {
              const next = v === true;
              setShowFooterCountdown(next);
              if (next && !promoCountdownLocal.trim()) {
                setPromoCountdownLocal(addDaysLocal(7));
              }
            }}
          />
          <Label htmlFor="cd">Hitung mundur di footer</Label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cdl">Label hitung mundur</Label>
            <Input
              id="cdl"
              value={footerCountdownLabel}
              onChange={(e) => setFooterCountdownLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cdt">Akhir promo (lokal)</Label>
            <Input
              id="cdt"
              type="datetime-local"
              value={promoCountdownLocal}
              onChange={(e) => setPromoCountdownLocal(e.target.value)}
              disabled={!showFooterCountdown}
            />
            {!showFooterCountdown ? (
              <p className="text-xs text-muted-foreground">
                Aktifkan “Hitung mundur” untuk memilih deadline promo.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gambar badge (storage)</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="file" accept="image/*" className="max-w-xs" onChange={(e) => void onUploadBadge(e)} />
            {badgePath ? <span className="text-xs text-muted-foreground">{badgePath}</span> : null}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Override URL badge (opsional)</Label>
            <Input value={badgeUrlOverride} onChange={(e) => setBadgeUrlOverride(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gambar best seller (storage)</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              className="max-w-xs"
              onChange={(e) => void onUploadBestSeller(e)}
            />
            {bestSellerPath ? (
              <span className="text-xs text-muted-foreground">{bestSellerPath}</span>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Override URL best seller (opsional)</Label>
            <Input
              value={bestSellerUrlOverride}
              onChange={(e) => setBestSellerUrlOverride(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Label>Sections</Label>
              <p className="text-xs text-muted-foreground">
                Isi headline, deskripsi, lalu tambah poin dengan mudah. Urutan di sini akan jadi urutan
                accordion di kartu.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSections((prev) => [
                  ...prev,
                  {
                    id: ensureIdLike(""),
                    title: "Section baru",
                    intro: null,
                    bullets: [],
                  },
                ]);
              }}
            >
              Tambah section
            </Button>
          </div>

          <div className="space-y-3">
            {sections.map((s, idx) => {
              const kind = kindOfSection(s);
              const headerId = `sec-${idx}`;
              const bulletsText = (s.bullets ?? []).join("\n");
              const bulletItemsText = (s.bullet_items ?? [])
                .map((l) => (l.struck ? `~~${l.text}` : l.text))
                .join("\n");
              const bonusLinesText = (s.bonus_lines ?? [])
                .map((l) => (l.struck ? `~~${l.text}` : l.text))
                .join("\n");

              return (
                <div key={headerId} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-[220px] grow space-y-2">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">ID (stabil)</Label>
                          <Input
                            value={s.id}
                            onChange={(e) => {
                              const v = ensureIdLike(e.target.value);
                              setSections((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, id: v } : p)),
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tipe</Label>
                          <Select
                            value={kind}
                            onValueChange={(v) => {
                              const nextKind = v as SectionKind;
                              setSections((prev) =>
                                prev.map((p, i) => {
                                  if (i !== idx) return p;
                                  const base = { id: p.id, title: p.title, intro: p.intro ?? null };
                                  if (nextKind === "bullets") return { ...base, bullets: [] };
                                  if (nextKind === "bullet_items") return { ...base, bullet_items: [] };
                                  return { ...base, bonus_lines: [] };
                                }),
                              );
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bullets">Bullet biasa</SelectItem>
                              <SelectItem value="bullet_items">Bullet (bisa dicoret)</SelectItem>
                              <SelectItem value="bonus_lines">Bonus lines (bisa dicoret)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Headline</Label>
                        <Input
                          value={s.title}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, title: e.target.value } : p)),
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Deskripsi (opsional)</Label>
                        <Textarea
                          rows={2}
                          value={s.intro ?? ""}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, intro: e.target.value.trim() ? e.target.value : null } : p,
                              ),
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Poin (1 baris = 1 item). Pakai prefix <span className="font-mono">~~</span> untuk coret.
                        </Label>
                        <Textarea
                          rows={Math.max(4, (s.bullets?.length ?? s.bullet_items?.length ?? s.bonus_lines?.length ?? 0) + 1)}
                          value={
                            kind === "bullets"
                              ? bulletsText
                              : kind === "bullet_items"
                                ? bulletItemsText
                                : bonusLinesText
                          }
                          onChange={(e) => {
                            const lines = e.target.value
                              .split("\n")
                              .map((x) => x.trim())
                              .filter(Boolean);
                            setSections((prev) =>
                              prev.map((p, i) => {
                                if (i !== idx) return p;
                                const base = { ...p, bullets: undefined, bullet_items: undefined, bonus_lines: undefined } as any;
                                if (kind === "bullets") {
                                  return { ...base, bullets: lines };
                                }
                                const items = lines.map((t) => {
                                  const struck = t.startsWith("~~");
                                  return { text: (struck ? t.slice(2) : t).trim(), struck };
                                });
                                if (kind === "bullet_items") return { ...base, bullet_items: items };
                                return { ...base, bonus_lines: items };
                              }),
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={idx === 0}
                        onClick={() =>
                          setSections((prev) => {
                            if (idx === 0) return prev;
                            const next = [...prev];
                            const t = next[idx - 1];
                            next[idx - 1] = next[idx];
                            next[idx] = t;
                            return next;
                          })
                        }
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={idx === sections.length - 1}
                        onClick={() =>
                          setSections((prev) => {
                            if (idx >= prev.length - 1) return prev;
                            const next = [...prev];
                            const t = next[idx + 1];
                            next[idx + 1] = next[idx];
                            next[idx] = t;
                            return next;
                          })
                        }
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setSections((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-navy">Advanced (JSON)</p>
                <p className="text-xs text-muted-foreground">
                  Opsional, hanya untuk debugging. Tidak perlu diubah untuk penggunaan normal.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdvancedJsonOpen((v) => !v)}
              >
                {advancedJsonOpen ? "Tutup" : "Lihat"}
              </Button>
            </div>
            {advancedJsonOpen ? (
              <Textarea
                className="mt-3 min-h-[200px] font-mono text-xs"
                value={sectionsJson}
                onChange={(e) => setSectionsJson(e.target.value)}
                onBlur={() => {
                  // If user edits advanced JSON, try to sync back to UI.
                  try {
                    const raw = JSON.parse(sectionsJson) as unknown;
                    if (!Array.isArray(raw)) throw new Error("Sections harus array JSON.");
                    const next: WeddingPackageSection[] = [];
                    for (const item of raw) {
                      const p = weddingPackageSectionZ.safeParse(item);
                      if (!p.success) throw new Error("Ada section yang tidak valid.");
                      next.push(p.data);
                    }
                    setSections(next);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "JSON sections tidak valid.");
                    setSectionsJson(JSON.stringify(sections, null, 2));
                  }
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
