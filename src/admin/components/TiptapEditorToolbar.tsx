import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Check,
  ChevronDown,
  Code,
  Copy,
  Eraser,
  GripVertical,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  LayoutGrid,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  MoreHorizontal,
  Pilcrow,
  Quote,
  Redo2,
  Scissors,
  Sigma,
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Type,
  Underline,
  Undo2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/share/ui/button";
import { Separator } from "@/share/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/share/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/share/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/share/ui/dialog";
import { Textarea } from "@/share/ui/textarea";
import { Input } from "@/share/ui/input";
import { Label } from "@/share/ui/label";
import type { InternalLinkTarget } from "@/admin/lib/siteNavLinks";
import { EditorLinkPopover } from "@/admin/components/EditorLinkPopover";
import { PackageCarouselInsertDialog } from "@/admin/components/PackageCarouselInsertDialog";
import { getClosestDocBlockBound, isParagraphBlock } from "@/admin/lib/blockRange";
import {
  blockNodeToHtmlFragment,
  copyActiveMarks,
  deleteDocBlock,
  duplicateDocBlock,
  moveDocBlockDown,
  moveDocBlockUp,
  pasteMarks,
  replaceDocBlockFromHtml,
  insertParagraphAfter,
  insertParagraphBefore,
  setParagraphMeta,
  type CopiedMarksState,
} from "@/admin/lib/blockCommands";
import { resolveBlogMediaPublicUrl, uploadBlogImage } from "@/blog/agencySupabaseBlog";

/** Radix menu item: hindari pencurian fokus dari ProseMirror agar mark/toggle bekerja pada seleksi. */
function editorDropdownPointerDown(e: React.PointerEvent) {
  e.preventDefault();
}

/** Tombol toolbar: cegah button mengambil fokus agar seleksi editor tidak hilang sebelum perintah dijalankan. */
function toolbarButtonMouseDown(e: React.MouseEvent) {
  e.preventDefault();
}

type Props = {
  editor: Editor;
  disabled?: boolean;
  internalTargets: InternalLinkTarget[];
  linkPopoverOpen: boolean;
  onLinkPopoverOpenChange: (open: boolean) => void;
  uploadUserId?: string | null;
};

export function TiptapEditorToolbar({
  editor,
  disabled,
  internalTargets,
  linkPopoverOpen,
  onLinkPopoverOpenChange,
  uploadUserId,
}: Props) {
  /** Re-render toolbar pada setiap transaksi tanpa `shouldRerenderOnTransaction` di parent (hindari loop dengan `onUpdate` → state → `content`). */
  useEditorState({
    editor,
    selector: (snapshot) => snapshot.transactionNumber,
  });

  const [htmlOpen, setHtmlOpen] = useState(false);
  const [htmlValue, setHtmlValue] = useState("");
  const [packageCarouselOpen, setPackageCarouselOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [videoUrlOpen, setVideoUrlOpen] = useState(false);
  const [videoUrlValue, setVideoUrlValue] = useState("");
  const copiedMarks = useRef<CopiedMarksState | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const el = barRef.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top;
        setPinned(top <= 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const openHtmlEditor = useCallback(() => {
    const html = blockNodeToHtmlFragment(editor);
    if (html === null) {
      toast.error("Tidak ada blok untuk diedit");
      return;
    }
    setHtmlValue(html);
    setHtmlOpen(true);
  }, [editor]);

  const applyHtml = useCallback(() => {
    const ok = replaceDocBlockFromHtml(editor, htmlValue);
    setHtmlOpen(false);
    if (!ok) {
      toast.error("HTML tidak valid untuk blok ini");
    } else {
      toast.success("Blok diperbarui");
    }
  }, [editor, htmlValue]);

  const openRename = useCallback(() => {
    if (!isParagraphBlock(editor)) {
      toast.message("Ubah nama hanya untuk paragraf");
      return;
    }
    const b = getClosestDocBlockBound(editor);
    const node = b ? editor.state.doc.nodeAt(b.from) : null;
    const label = (node?.attrs?.dataLabel as string | null) ?? "";
    setRenameValue(label ?? "");
    setRenameOpen(true);
  }, [editor]);

  const applyRename = useCallback(() => {
    const v = renameValue.trim() || null;
    setRenameOpen(false);
    setParagraphMeta(editor, { dataLabel: v });
    toast.success(v ? "Label disimpan" : "Label dihapus");
  }, [editor, renameValue]);

  const openVideoUrl = useCallback(() => {
    setVideoUrlValue("");
    setVideoUrlOpen(true);
  }, []);

  const applyVideoUrl = useCallback(() => {
    const src = videoUrlValue.trim();
    setVideoUrlOpen(false);
    if (!src) return;
    const ok = editor
      .chain()
      .focus()
      .setYoutubeVideo({
        src,
      })
      .run();
    if (!ok) {
      toast.error("URL video tidak valid atau editor tidak mendukung embed video.");
    } else {
      toast.success("Video disisipkan");
    }
  }, [editor, videoUrlValue]);

  const copyBlockHtml = useCallback(async () => {
    const html = blockNodeToHtmlFragment(editor);
    if (!html) {
      return;
    }
    try {
      await navigator.clipboard.writeText(html);
      toast.success("HTML blok disalin");
    } catch {
      toast.error("Gagal menyalin");
    }
  }, [editor]);

  const cutBlock = useCallback(async () => {
    await copyBlockHtml();
    deleteDocBlock(editor);
  }, [copyBlockHtml, editor]);

  const createPattern = useCallback(async () => {
    const b = getClosestDocBlockBound(editor);
    const node = b ? editor.state.doc.nodeAt(b.from) : null;
    if (!node) {
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(node.toJSON(), null, 2));
      toast.success("Cuplikan JSON blok disalin (tempel di editor lain)");
    } catch {
      toast.error("Gagal menyalin");
    }
  }, [editor]);

  const addNoteBlock = useCallback(() => {
    const b = getClosestDocBlockBound(editor);
    if (!b) {
      return;
    }
    editor
      .chain()
      .focus()
      .insertContentAt(b.to, "<blockquote><p><strong>Catatan:</strong> </p></blockquote>")
      .run();
  }, [editor]);

  const insertImageByUrl = useCallback(() => {
    const raw = window.prompt("URL gambar (https://… atau /path)");
    if (!raw?.trim()) {
      return;
    }
    const src = raw.trim();
    const ok = editor.chain().focus().setImage({ src }).run();
    if (!ok) {
      toast.error("Gambar tidak bisa disisipkan di posisi ini (coba di dalam paragraf).");
    }
  }, [editor]);

  const canUpload = Boolean(uploadUserId && !uploadingImage);
  const uploadLabel = useMemo(
    () => (uploadingImage ? "Mengunggah…" : "Upload gambar"),
    [uploadingImage],
  );

  const onPickUploadImage = useCallback(() => {
    if (!uploadUserId) {
      toast.error("Login admin diperlukan untuk upload gambar.");
      return;
    }
    uploadInputRef.current?.click();
  }, [uploadUserId]);

  const onUploadImageFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      if (!uploadUserId) {
        toast.error("Login admin diperlukan untuk upload gambar.");
        return;
      }
      setUploadingImage(true);
      try {
        const path = await uploadBlogImage(file, uploadUserId);
        const src = resolveBlogMediaPublicUrl(path);
        const ok = editor.chain().focus().setImage({ src }).run();
        if (!ok) {
          toast.error("Gambar tidak bisa disisipkan di posisi ini (coba di dalam paragraf).");
          return;
        }
        toast.success("Gambar disisipkan.");
      } catch (e) {
        toast.error((e as Error).message || "Gagal upload gambar.");
      } finally {
        setUploadingImage(false);
      }
    },
    [editor, uploadUserId],
  );

  const insertMathPlaceholder = useCallback(() => {
    editor.chain().focus().insertContent(" \\( contoh: x^2 + y^2 = r^2 \\) ").run();
  }, [editor]);

  if (disabled) {
    return null;
  }

  return (
    <>
      <div
        ref={barRef}
        className={[
          "sticky top-0 z-40",
          pinned ? "shadow-sm" : "",
        ].join(" ")}
      >
        <div className="flex flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-border bg-background/95 p-2 whitespace-nowrap backdrop-blur supports-[backdrop-filter]:bg-background/80 no-scrollbar">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().undo().run()}
          title="Urungkan"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().redo().run()}
          title="Ulangi"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2">
              <Pilcrow className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => {
                const ok = editor.chain().focus().setParagraph().run();
                if (!ok) {
                  toast.message("Paragraf tidak bisa diterapkan di posisi ini.");
                }
              }}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Type className="h-4 w-4 shrink-0" aria-hidden />
                  Paragraf
                </span>
                {editor.isActive("paragraph") && !editor.isActive("heading") ? (
                  <Check className="h-4 w-4 shrink-0 text-navy" aria-hidden />
                ) : null}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => {
                const ok = editor.chain().focus().setHeading({ level: 2 }).run();
                if (!ok) {
                  toast.message("Heading 2 tidak bisa diterapkan di sini.");
                }
              }}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Heading2 className="h-4 w-4 shrink-0" aria-hidden />
                  Heading 2
                </span>
                {editor.isActive("heading", { level: 2 }) ? (
                  <Check className="h-4 w-4 shrink-0 text-navy" aria-hidden />
                ) : null}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => {
                const ok = editor.chain().focus().setHeading({ level: 3 }).run();
                if (!ok) {
                  toast.message("Heading 3 tidak bisa diterapkan di sini.");
                }
              }}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Heading3 className="h-4 w-4 shrink-0" aria-hidden />
                  Heading 3
                </span>
                {editor.isActive("heading", { level: 3 }) ? (
                  <Check className="h-4 w-4 shrink-0 text-navy" aria-hidden />
                ) : null}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("code") ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Button>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2">
              Lainnya
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs">Tampilan teks</DropdownMenuLabel>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => editor.chain().focus().toggleHighlight().run()}
            >
              <Highlighter className="mr-2 h-4 w-4" /> Sorotan
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => editor.chain().focus().toggleFootnoteRef().run()}
            >
              <SupIcon className="mr-2 h-4 w-4" /> Catatan kaki (ref)
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="mr-2 h-4 w-4" /> Kode inline
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void insertImageByUrl()}
            >
              <ImageIcon className="mr-2 h-4 w-4" /> Gambar inline (URL)
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => openVideoUrl()}
            >
              <Video className="mr-2 h-4 w-4" /> Video (URL)
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => editor.chain().focus().toggleKbd().run()}
            >
              <span className="mr-2 font-mono text-xs">kbd</span> Input keyboard
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void insertMathPlaceholder()}
            >
              <Sigma className="mr-2 h-4 w-4" /> Cuplikan matematika
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="mr-2 h-4 w-4" /> Coret
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => editor.chain().focus().toggleSubscript().run()}
            >
              <SubIcon className="mr-2 h-4 w-4" /> Subskrip
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => editor.chain().focus().toggleSuperscript().run()}
            >
              <SupIcon className="mr-2 h-4 w-4" /> Superskrip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          title="Kurangi indent daftar (Shift+Tab) — di luar daftar tidak berlaku"
          disabled={disabled || !editor.isActive("listItem")}
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => {
            const ok = editor.chain().focus().liftListItem("listItem").run();
            if (!ok) {
              toast.message(
                "Tidak bisa mengurangi indent di posisi ini (mis. sudah di tingkat paling luar daftar).",
              );
            }
          }}
        >
          <IndentDecrease className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          title="Tambah indent daftar (Tab) — perlu poin lain di atasnya; poin pertama biasanya tidak bisa di-indent"
          disabled={disabled || !editor.isActive("listItem")}
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => {
            const ok = editor.chain().focus().sinkListItem("listItem").run();
            if (!ok) {
              toast.message(
                "Tidak bisa menambah indent di sini. Pilih poin yang ada di bawah poin lain (harus ada item di atas dalam daftar yang sama), lalu coba lagi atau gunakan Tab.",
              );
            }
          }}
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
          className="h-8 px-2"
          title="Blok kode"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Braces className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Popover modal={false} open={linkPopoverOpen} onOpenChange={onLinkPopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive("link") ? "secondary" : "outline"}
              className="h-8 gap-1 px-2"
              onMouseDown={toolbarButtonMouseDown}
            >
              <Link2 className="h-4 w-4" />
              Tautan
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <EditorLinkPopover
              editor={editor}
              internalTargets={internalTargets}
              open={linkPopoverOpen}
            />
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => openVideoUrl()}
          title="Sisipkan video via URL"
        >
          <Video className="h-4 w-4" />
        </Button>
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void onUploadImageFile(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 gap-1 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => void onPickUploadImage()}
          disabled={!canUpload}
          title={uploadLabel}
        >
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{uploadLabel}</span>
        </Button>
        <Dialog open={videoUrlOpen} onOpenChange={setVideoUrlOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sisipkan video via URL</DialogTitle>
              <DialogDescription>
                Tempel URL YouTube (contoh: `https://www.youtube.com/watch?v=...` atau `https://youtu.be/...`).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="video-url">URL video</Label>
              <Input
                id="video-url"
                value={videoUrlValue}
                onChange={(e) => setVideoUrlValue(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyVideoUrl();
                  }
                }}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setVideoUrlOpen(false)}>
                Batal
              </Button>
              <Button type="button" onClick={applyVideoUrl}>
                Sisipkan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("packageCarousel") ? "secondary" : "ghost"}
          className="h-8 gap-1 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => setPackageCarouselOpen(true)}
          title="Blok carousel paket pricelist"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Paket</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => editor.chain().focus().unsetAllMarks().unsetLink().run()}
          title="Hapus format teks (tautan & gaya)"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2">
              <GripVertical className="h-4 w-4" />
              Blok
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">Papan klip</DropdownMenuLabel>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void copyBlockHtml()}
            >
              <Copy className="mr-2 h-4 w-4" /> Salin blok
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void cutBlock()}
            >
              <Scissors className="mr-2 h-4 w-4" /> Potong blok
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => duplicateDocBlock(editor) && toast.success("Blok diduplikasi")}
            >
              Duplikat blok
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => insertParagraphBefore(editor)}
            >
              Tambah paragraf sebelum
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => insertParagraphAfter(editor)}
            >
              Tambah paragraf sesudah
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void addNoteBlock()}
            >
              Tambah catatan (blockquote)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => {
                copiedMarks.current = copyActiveMarks(editor);
                toast.success("Gaya teks disalin");
              }}
            >
              Salin gaya teks
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => {
                if (pasteMarks(editor, copiedMarks.current)) {
                  toast.success("Gaya ditempel");
                } else {
                  toast.message("Salin gaya dulu");
                }
              }}
            >
              Tempel gaya teks
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => editor.chain().focus().toggleBlockquote().run()}
            >
              Grup (blockquote)
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void openRename()}
            >
              Ubah nama blok (paragraf)
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => {
                if (!isParagraphBlock(editor)) {
                  toast.message("Hanya paragraf");
                  return;
                }
                const b = getClosestDocBlockBound(editor);
                const node = b ? editor.state.doc.nodeAt(b.from) : null;
                const locked = node?.attrs?.dataLocked === "true";
                setParagraphMeta(editor, { dataLocked: locked ? "false" : "true" });
                toast.success(locked ? "Blok tidak dikunci" : "Blok dikunci (visual)");
              }}
            >
              Kunci / buka kunci
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => {
                if (!isParagraphBlock(editor)) {
                  toast.message("Hanya paragraf");
                  return;
                }
                const b = getClosestDocBlockBound(editor);
                const node = b ? editor.state.doc.nodeAt(b.from) : null;
                const hidden = node?.attrs?.dataPublic === "false";
                setParagraphMeta(editor, { dataPublic: hidden ? "true" : "false" });
                toast.success(hidden ? "Blok tampil di situs" : "Blok disembunyikan di situs");
              }}
            >
              Sembunyikan di situs
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void createPattern()}
            >
              Buat pola (salin JSON)
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void openHtmlEditor()}
            >
              Edit sebagai HTML
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => moveDocBlockUp(editor) || toast.message("Sudah di atas")}
            >
              Pindah blok ke atas
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => moveDocBlockDown(editor) || toast.message("Sudah di bawah")}
            >
              Pindah blok ke bawah
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              className="text-destructive focus:text-destructive"
              onSelect={() => deleteDocBlock(editor) && toast.success("Blok dihapus")}
            >
              Hapus blok
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="ghost" className="h-8 px-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void openHtmlEditor()}
            >
              Edit blok sebagai HTML
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={editorDropdownPointerDown}
              onSelect={() => void createPattern()}
            >
              Salin pola blok (JSON)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      <PackageCarouselInsertDialog
        editor={editor}
        open={packageCarouselOpen}
        onOpenChange={setPackageCarouselOpen}
      />

      <Dialog open={htmlOpen} onOpenChange={setHtmlOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit blok sebagai HTML</DialogTitle>
            <DialogDescription>
              Sunting HTML untuk satu blok di posisi kursor. Struktur harus tetap satu akar blok
              yang valid.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            className="min-h-[220px] font-mono text-sm"
            value={htmlValue}
            onChange={(e) => setHtmlValue(e.target.value)}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setHtmlOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={() => void applyHtml()}>
              Terapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Label blok (paragraf)</DialogTitle>
            <DialogDescription>
              Nama opsional untuk mengenali paragraf ini di editor (bukan teks yang tampil ke
              pembaca).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="bl-label">Nama internal (opsional)</Label>
            <Input
              id="bl-label"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Contoh: Intro CTA"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={() => void applyRename()}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
