import { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, LayoutGrid } from "lucide-react";
import { Button } from "@/share/ui/button";
import { Checkbox } from "@/share/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/share/ui/dialog";
import { Label } from "@/share/ui/label";
import { normalizeCarouselPackageIds } from "@/blog/weddingPackageIds";
import { adminListPackages } from "@/blog/weddingPackages";
import { toast } from "sonner";

function getCarouselNodeAtSelection(editor: Editor) {
  const { state } = editor;
  const sel = state.selection;
  if (sel instanceof NodeSelection && sel.node.type.name === "packageCarousel") {
    return { pos: sel.from, node: sel.node };
  }
  const $pos = sel.$from;
  for (let d = $pos.depth; d >= 0; d--) {
    const n = $pos.node(d);
    if (n.type.name === "packageCarousel") {
      return { pos: $pos.before(d), node: n };
    }
  }
  return null;
}

function sanitizePickerOrder(ids: readonly string[], validIds: Set<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const t = id.trim();
    if (!validIds.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

type Props = {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PackageCarouselInsertDialog({ editor, open, onOpenChange }: Props) {
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"insert" | "edit">("insert");

  const { data: allPkgs = [] } = useQuery({
    queryKey: ["admin", "packages", "list"],
    queryFn: adminListPackages,
    enabled: open,
  });

  // React Query may return new array instances; memoize by the stable id list to avoid effect loops.
  const validIdKey = useMemo(() => allPkgs.map((p) => p.id).join(","), [allPkgs]);
  const validIdSet = useMemo(() => new Set(allPkgs.map((p) => p.id)), [validIdKey]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const hit = getCarouselNodeAtSelection(editor);
    setMode(hit ? "edit" : "insert");
    if (hit) {
      const raw = (hit.node.attrs.packageIds as string[] | undefined) ?? [];
      setOrderedIds(sanitizePickerOrder(normalizeCarouselPackageIds(raw), validIdSet));
    } else {
      setOrderedIds([]);
    }
  }, [open, editor, validIdKey]);

  const applyHomeOrder = () => {
    setOrderedIds((prev) => {
      const set = new Set(prev);
      return allPkgs.filter((p) => set.has(p.id)).map((p) => p.id);
    });
  };

  const toggleId = (id: string, checked: boolean) => {
    setOrderedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    setOrderedIds((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const t = next[index]!;
      next[index] = next[j]!;
      next[j] = t;
      return next;
    });
  };

  const onConfirm = () => {
    const ids = sanitizePickerOrder(orderedIds, validIdSet);
    const hit = getCarouselNodeAtSelection(editor);

    // Insert mode: must select at least one package.
    if (!hit && ids.length === 0) {
      toast.error("Pilih minimal satu paket.");
      return;
    }

    // Edit mode: allow clearing all selections -> remove the block from the document.
    if (hit && ids.length === 0) {
      const ok = editor
        .chain()
        .focus()
        .deleteRange({ from: hit.pos, to: hit.pos + hit.node.nodeSize })
        .run();
      if (!ok) {
        toast.error("Gagal menghapus blok paket.");
        return;
      }
      onOpenChange(false);
      toast.success("Blok paket dihapus.");
      return;
    }

    if (hit) {
      const ok = editor
        .chain()
        .focus()
        .setNodeMarkup(hit.pos, undefined, { packageIds: ids })
        .run();
      if (!ok) {
        toast.error("Gagal memperbarui blok paket.");
        return;
      }
    } else {
      const ok = editor
        .chain()
        .focus()
        .insertContent({ type: "packageCarousel", attrs: { packageIds: ids } })
        .run();
      if (!ok) {
        toast.error("Tidak bisa menyisipkan blok di posisi ini.");
        return;
      }
    }
    onOpenChange(false);
    toast.success(hit ? "Blok paket diperbarui." : "Blok paket disisipkan.");
  };

  const editing = mode === "edit";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          // Close should behave like "cancel": no changes applied, reset local draft.
          setOrderedIds([]);
          setMode("insert");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[min(92vh,46rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 shrink-0" aria-hidden />
            {editing ? "Perbarui blok paket" : "Sisipkan blok paket"}
          </DialogTitle>
          <DialogDescription>
            Pilih satu atau beberapa paket (data Supabase). Urutan kartu mengikuti daftar di bawah
            (naik/turun). &quot;Urutkan seperti beranda&quot; mengikuti urutan `sort_order` di CMS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            {allPkgs.map((p) => (
              <div key={p.id} className="flex items-start gap-3">
                <Checkbox
                  id={`pkg-${p.id}`}
                  checked={orderedIds.includes(p.id)}
                  onCheckedChange={(v) => toggleId(p.id, v === true)}
                />
                <Label
                  htmlFor={`pkg-${p.id}`}
                  className="cursor-pointer text-sm leading-snug font-normal"
                >
                  {p.title}
                  {!p.is_published ? (
                    <span className="ml-2 text-xs text-amber-700">(draf)</span>
                  ) : null}
                </Label>
              </div>
            ))}
            {allPkgs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Belum ada paket di database. Buat paket di menu Paket terlebih dahulu.
              </p>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Urutan di artikel
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={applyHomeOrder}
              >
                Urutkan seperti beranda
              </Button>
            </div>
            <ol className="space-y-1.5">
              {orderedIds.map((id, index) => {
                const row = allPkgs.find((p) => p.id === id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{row?.title ?? id}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label="Naik"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={index === orderedIds.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Turun"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ol>
            {orderedIds.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Belum ada paket dipilih.</p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" onClick={onConfirm}>
            {editing ? "Simpan" : "Sisipkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
