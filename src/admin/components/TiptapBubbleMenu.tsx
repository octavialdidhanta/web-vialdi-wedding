import type { Editor } from "@tiptap/core";
import type { MouseEvent } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Link2, Underline } from "lucide-react";
import { Button } from "@/share/ui/button";
import { Separator } from "@/share/ui/separator";

function toolbarButtonMouseDown(e: MouseEvent) {
  e.preventDefault();
}

type Props = {
  editor: Editor;
  /** Buka popover tautan di toolbar utama (state di parent). */
  onLinkPopoverRequest: () => void;
};

/**
 * Menu melayang untuk seleksi teks. Dipisah dari toolbar agar `useEditorState` di toolbar
 * tidak memicu re-render komponen ini setiap transaksi (BubbleMenu memasang plugin lewat dispatch).
 */
export function TiptapBubbleMenu({ editor, onLinkPopoverRequest }: Props) {
  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top-start" }}
      shouldShow={({ state }) => !state.selection.empty}
    >
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md">
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
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          className="h-8 px-2"
          onMouseDown={toolbarButtonMouseDown}
          onClick={() => onLinkPopoverRequest()}
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
}
