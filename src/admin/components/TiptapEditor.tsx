import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import type { EditorView } from "prosemirror-view";
import { toast } from "sonner";
import { tiptapExtensions } from "@/admin/lib/editorExtensions";
import { TiptapBubbleMenu } from "@/admin/components/TiptapBubbleMenu";
import { TiptapEditorToolbar } from "@/admin/components/TiptapEditorToolbar";
import type { InternalLinkTarget } from "@/admin/lib/siteNavLinks";
import { isPlaceholderTiptapDoc } from "@/admin/lib/htmlToTiptapDoc";
import { resolveBlogMediaPublicUrl, uploadBlogImage } from "@/blog/supabaseBlog";

function isImageFile(file: File): boolean {
  return /^image\//i.test(file.type);
}

type InnerProps = {
  initialJson: JSONContent | null;
  initialHtml: string;
  onChangeJson: (doc: JSONContent) => void;
  disabled?: boolean;
  internalLinkTargets: InternalLinkTarget[];
  uploadUserId?: string | null;
};

const emptyDoc: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

function TiptapEditorInner({
  initialJson,
  initialHtml,
  onChangeJson,
  disabled,
  internalLinkTargets,
  uploadUserId,
}: InnerProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);

  const hasJson = Boolean(
    initialJson?.type === "doc" &&
      initialJson.content &&
      initialJson.content.length > 0 &&
      !isPlaceholderTiptapDoc(initialJson),
  );

  const initialContent = hasJson
    ? initialJson!
    : initialHtml.trim().length > 0
      ? initialHtml
      : emptyDoc;

  const onPasteImage = useMemo(() => {
    return async (view: EditorView, event: ClipboardEvent): Promise<boolean> => {
      const files = Array.from(event.clipboardData?.files ?? []).filter(isImageFile);
      if (files.length === 0) {
        return false;
      }

      if (!uploadUserId) {
        toast.error("Tidak bisa tempel gambar: uploadUserId belum tersedia.");
        return true;
      }

      // Handle single-image paste (most common). Ignore additional images for now.
      const file = files[0]!;
      const toastId = toast.loading("Mengunggah gambar…");

      try {
        const path = await uploadBlogImage(file, uploadUserId);
        const url = resolveBlogMediaPublicUrl(path);
        if (!url) {
          throw new Error("URL gambar tidak ditemukan setelah upload.");
        }
        // Insert at current selection.
        view.dispatch(
          view.state.tr.replaceSelectionWith(view.state.schema.nodes.image.create({ src: url })),
        );
        toast.success("Gambar ditambahkan", { id: toastId });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal upload gambar", { id: toastId });
      }

      return true;
    };
  }, [uploadUserId]);

  const editor = useEditor({
    extensions: tiptapExtensions,
    editable: !disabled,
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      onChangeJson(ed.getJSON() as JSONContent);
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-editor-root prose prose-neutral min-h-[320px] max-w-none px-3 py-3 focus:outline-none prose-headings:text-navy prose-p:text-foreground/90 prose-a:text-accent-orange prose-blockquote:border-l-accent-orange",
      },
      handlePaste: (view, event) => {
        // Best-effort async paste: return true to stop default paste, then insert after upload.
        void onPasteImage(view, event);
        const files = Array.from(event.clipboardData?.files ?? []).filter(isImageFile);
        return files.length > 0;
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div className="min-h-[320px] rounded-md border border-border bg-muted/30">
        <div className="border-b border-border bg-muted/40 p-2 text-xs text-muted-foreground">
          Memuat editor…
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-background">
      {!disabled ? (
        <TiptapBubbleMenu editor={editor} onLinkPopoverRequest={() => setLinkPopoverOpen(true)} />
      ) : null}
      <TiptapEditorToolbar
        editor={editor}
        disabled={disabled}
        internalTargets={internalLinkTargets}
        linkPopoverOpen={linkPopoverOpen}
        onLinkPopoverOpenChange={setLinkPopoverOpen}
        uploadUserId={uploadUserId}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

type Props = {
  mountKey: string;
  initialJson: JSONContent | null;
  initialHtml: string;
  onChangeJson: (doc: JSONContent) => void;
  disabled?: boolean;
  /** Halaman statis + daftar artikel untuk pemilih tautan internal */
  internalLinkTargets?: InternalLinkTarget[];
  /** userId for uploading blog media */
  uploadUserId?: string | null;
};

export function TiptapEditor({
  mountKey,
  initialJson,
  initialHtml,
  onChangeJson,
  disabled,
  internalLinkTargets = [],
  uploadUserId,
}: Props) {
  return (
    <div key={mountKey}>
      <TiptapEditorInner
        initialJson={initialJson}
        initialHtml={initialHtml}
        onChangeJson={onChangeJson}
        disabled={disabled}
        internalLinkTargets={internalLinkTargets}
        uploadUserId={uploadUserId}
      />
    </div>
  );
}
