import { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/core";
import { CornerDownLeft, FileText, Link2, Newspaper } from "lucide-react";
import { Button } from "@/share/ui/button";
import { Input } from "@/share/ui/input";
import { Label } from "@/share/ui/label";
import { ScrollArea } from "@/share/ui/scroll-area";
import { Switch } from "@/share/ui/switch";
import type { InternalLinkTarget } from "@/admin/lib/siteNavLinks";
import { cn } from "@/share/lib/utils";

const BTN_CLASS = "blog-cta-btn";

function normalizeHref(raw: string): string {
  const t = raw.trim();
  if (!t) {
    return "";
  }
  if (
    /^https?:\/\//i.test(t) ||
    t.startsWith("/") ||
    t.startsWith("#") ||
    t.startsWith("mailto:")
  ) {
    return t;
  }
  return `https://${t}`;
}

function kindIcon(kind: string) {
  if (kind === "Artikel" || kind === "Blog home") {
    return Newspaper;
  }
  return FileText;
}

type Props = {
  editor: Editor;
  internalTargets: InternalLinkTarget[];
  open: boolean;
};

export function EditorLinkPopover({ editor, internalTargets, open }: Props) {
  const active = editor.isActive("link");
  const [url, setUrl] = useState("");
  const [asButton, setAsButton] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    const attrs = editor.getAttributes("link") as { href?: string; class?: string | null };
    setUrl(attrs.href ?? "");
    setAsButton(typeof attrs.class === "string" && attrs.class.split(/\s+/).includes(BTN_CLASS));
    setQ("");
  }, [open, editor]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) {
      return internalTargets;
    }
    return internalTargets.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.path.toLowerCase().includes(s) ||
        t.kind.toLowerCase().includes(s),
    );
  }, [internalTargets, q]);

  function applyHref(href: string, button: boolean) {
    const h = normalizeHref(href);
    if (!h) {
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: h,
        class: button ? BTN_CLASS : null,
      })
      .run();
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }

  return (
    <div className="w-[min(100vw-2rem,22rem)] space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-navy">
        <Link2 className="h-4 w-4 shrink-0" aria-hidden />
        Tautan
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-url" className="text-xs">
          Cari halaman atau ketik URL
        </Label>
        <div className="relative">
          <Input
            id="link-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… atau /halaman"
            className="pr-10"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyHref(url, asButton);
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2"
            title="Terapkan"
            onClick={() => applyHref(url, asButton)}
          >
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-navy">Tampil sebagai tombol</p>
          <p className="text-[10px] text-muted-foreground">Gaya CTA di artikel publik</p>
        </div>
        <Switch checked={asButton} onCheckedChange={setAsButton} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Halaman & artikel</Label>
        <Input
          className="mt-1.5"
          placeholder="Cari judul atau path…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ScrollArea className="mt-2 h-48 rounded-md border border-border">
          <ul className="p-1">
            {filtered.map((t) => {
              const Icon = kindIcon(t.kind);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                    )}
                    onClick={() => {
                      setUrl(t.path);
                      applyHref(t.path, asButton);
                    }}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-navy">{t.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{t.path}</span>
                    </span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {t.kind}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => applyHref(url, asButton)}
        >
          Simpan tautan
        </Button>
        {active ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={removeLink}
          >
            Hapus tautan
          </Button>
        ) : null}
      </div>
    </div>
  );
}
