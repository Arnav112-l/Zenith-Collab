"use client";

import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
} from "lucide-react";

interface ToolbarProps {
  editor: Editor | null;
}

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="sticky top-0 z-20 w-full max-w-[900px] mx-auto flex items-center gap-1 px-8 sm:px-12 md:px-16 lg:px-24 py-2.5 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center gap-0.5">
        <ToggleButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} strokeWidth={2.5} />
        </ToggleButton>
        <ToggleButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} strokeWidth={2.5} />
        </ToggleButton>
        <ToggleButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough size={16} strokeWidth={2.5} />
        </ToggleButton>
      </div>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

      <div className="flex items-center gap-0.5">
        <ToggleButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={16} strokeWidth={2.5} />
        </ToggleButton>
        <ToggleButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={16} strokeWidth={2.5} />
        </ToggleButton>
        <ToggleButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={16} strokeWidth={2.5} />
        </ToggleButton>
      </div>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

      <div className="flex items-center gap-0.5">
        <ToggleButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={16} strokeWidth={2.5} />
        </ToggleButton>
        <ToggleButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered size={16} strokeWidth={2.5} />
        </ToggleButton>
      </div>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

      <div className="flex items-center gap-0.5">
        <ToggleButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote size={16} strokeWidth={2.5} />
        </ToggleButton>
        <ToggleButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <Code size={16} strokeWidth={2.5} />
        </ToggleButton>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-0.5">
        <ToggleButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} strokeWidth={2.5} />
        </ToggleButton>
        <ToggleButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo size={16} strokeWidth={2.5} />
        </ToggleButton>
      </div>
    </div>
  );
}

const ToggleButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded-md transition-all ${
      isActive
        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
    } ${
      disabled ? "opacity-30 cursor-not-allowed" : ""
    }`}
  >
    {children}
  </button>
);
