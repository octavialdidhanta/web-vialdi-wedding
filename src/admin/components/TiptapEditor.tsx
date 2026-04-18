import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { tiptapExtensions } from "@/admin/lib/editorExtensions";
import { TiptapBubbleMenu } from "@/admin/components/TiptapBubbleMenu";
import { TiptapEditorToolbar } from "@/admin/components/TiptapEditorToolbar";
import type { InternalLinkTarget } from "@/admin/lib/siteNavLinks";

type InnerProps = {
  initialJson: JSONContent | null;
  initialHtml: string;
  onChangeJson: (doc: JSONContent) => void;
  disabled?: boolean;
  internalLinkTargets: InternalLinkTarget[];
};

const emptyDoc: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

function TiptapEditorInner({
  initialJson,
  initialHtml,
  onChangeJson,
  disabled,
  internalLinkTargets,
}: InnerProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);

  const hasJson = Boolean(
    initialJson?.type &&
    initialJson.content &&
    initialJson.content.length > 0 &&
    initialJson.content[0],
  );

  const initialContent = hasJson
    ? initialJson!
    : initialHtml.trim().length > 0
      ? initialHtml
      : emptyDoc;

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
};

export function TiptapEditor({
  mountKey,
  initialJson,
  initialHtml,
  onChangeJson,
  disabled,
  internalLinkTargets = [],
}: Props) {
  return (
    <div key={mountKey}>
      <TiptapEditorInner
        initialJson={initialJson}
        initialHtml={initialHtml}
        onChangeJson={onChangeJson}
        disabled={disabled}
        internalLinkTargets={internalLinkTargets}
      />
    </div>
  );
}
