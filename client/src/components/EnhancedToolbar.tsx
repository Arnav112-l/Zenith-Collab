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
  Type,
  Palette,
  Highlighter,
  Image as ImageIcon,
  Download,
  Smile,
} from "lucide-react";
import { useState, useRef } from "react";

interface EnhancedToolbarProps {
  editor: Editor | null;
  onExport?: (format: 'pdf' | 'docx' | 'txt') => void;
}

export default function EnhancedToolbar({ editor, onExport }: EnhancedToolbarProps) {
  const [showFontSize, setShowFontSize] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px'];
  const textColors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#9900ff', '#ff0099'];
  const highlightColors = ['transparent', '#ffff00', '#00ff00', '#00ffff', '#ff99cc', '#ff9999', '#99ff99', '#9999ff'];
  const fontFamilies = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Playfair Display', value: '"Playfair Display", serif' },
    { name: 'Fira Code', value: '"Fira Code", monospace' },
    { name: 'Lora', value: 'Lora, serif' },
    { name: 'Merriweather', value: 'Merriweather, serif' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        editor.chain().focus().setImage({ src: url }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const addEmoji = () => {
    const emoji = prompt('Enter emoji or use emoji picker:');
    if (emoji) {
      editor.chain().focus().insertContent(emoji).run();
    }
  };

  return (
    <div className="sticky top-4 z-20 w-full max-w-5xl mx-auto mb-6">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-[#0a0a0a]/60 backdrop-blur-xl border border-[#27272a] rounded-2xl shadow-2xl">
        {/* Text Formatting Group */}
        <div className="flex items-center gap-0.5 bg-[#27272a]/50 rounded-xl p-1 border border-white/5">
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

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Font Controls */}
        <div className="flex items-center gap-0.5">
          <div className="relative">
            <ToggleButton
              onClick={() => setShowFontFamily(!showFontFamily)}
              title="Font Family"
            >
              <Type size={16} strokeWidth={2.5} />
            </ToggleButton>
            <Dropdown show={showFontFamily} onClose={() => setShowFontFamily(false)}>
              <div className="flex flex-col gap-1">
                {fontFamilies.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => {
                      editor.chain().focus().setFontFamily(font.value).run();
                      setShowFontFamily(false);
                    }}
                    className="px-4 py-2.5 text-left text-sm rounded-lg hover:bg-[#f472b6]/10 hover:text-[#f472b6] transition-colors text-gray-300"
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>

          <div className="relative">
            <ToggleButton
              onClick={() => setShowFontSize(!showFontSize)}
              title="Font Size"
            >
              <span className="text-xs font-bold px-1">Size</span>
            </ToggleButton>
            <Dropdown show={showFontSize} onClose={() => setShowFontSize(false)}>
              <div className="grid grid-cols-2 gap-1">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      const currentSelection = editor.state.selection;
                      const selectedText = editor.state.doc.textBetween(currentSelection.from, currentSelection.to);
                      
                      if (selectedText) {
                        editor
                          .chain()
                          .focus()
                          .deleteSelection()
                          .insertContent(`<span style="font-size: ${size}">${selectedText}</span>`)
                          .run();
                      }
                      setShowFontSize(false);
                    }}
                    className="px-3 py-2 text-sm rounded-lg hover:bg-[#f472b6]/10 hover:text-[#f472b6] whitespace-nowrap font-medium transition-colors text-gray-300"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Colors */}
        <div className="flex items-center gap-0.5">
          <div className="relative">
            <ToggleButton
              onClick={() => setShowTextColor(!showTextColor)}
              title="Text Color"
            >
              <Palette size={16} strokeWidth={2.5} />
            </ToggleButton>
            <Dropdown show={showTextColor} onClose={() => setShowTextColor(false)}>
              <div className="grid grid-cols-5 gap-2 p-2">
                {textColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowTextColor(false);
                    }}
                    className="w-6 h-6 rounded border-2 border-[#3f3f46] hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </Dropdown>
          </div>

          <div className="relative">
            <ToggleButton
              onClick={() => setShowHighlight(!showHighlight)}
              title="Highlight"
            >
              <Highlighter size={16} strokeWidth={2.5} />
            </ToggleButton>
            <Dropdown show={showHighlight} onClose={() => setShowHighlight(false)}>
              <div className="grid grid-cols-4 gap-2 p-2">
                {highlightColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      if (color === 'transparent') {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor.chain().focus().setHighlight({ color }).run();
                      }
                      setShowHighlight(false);
                    }}
                    className="w-6 h-6 rounded border-2 border-[#3f3f46] hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color === 'transparent' ? 'No highlight' : color}
                  />
                ))}
              </div>
            </Dropdown>
          </div>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Headings Group */}
        <div className="flex items-center gap-0.5 bg-[#27272a]/50 rounded-xl p-1 border border-white/5">
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

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Lists Group */}
        <div className="flex items-center gap-0.5 bg-[#27272a]/50 rounded-xl p-1 border border-white/5">
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

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Blocks Group */}
        <div className="flex items-center gap-0.5 bg-[#27272a]/50 rounded-xl p-1 border border-white/5">
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

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Media & Actions */}
        <div className="flex items-center gap-0.5">
          <ToggleButton
            onClick={() => fileInputRef.current?.click()}
            title="Insert Image"
          >
            <ImageIcon size={16} strokeWidth={2.5} />
          </ToggleButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <ToggleButton
            onClick={addEmoji}
            title="Add Emoji"
          >
            <Smile size={16} strokeWidth={2.5} />
          </ToggleButton>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <div className="relative">
            <ToggleButton
              onClick={() => setShowExport(!showExport)}
              title="Export Document"
            >
              <Download size={16} strokeWidth={2.5} />
            </ToggleButton>
            <Dropdown show={showExport} onClose={() => setShowExport(false)}>
              <div className="flex flex-col gap-1 min-w-[120px]">
                <button
                  onClick={() => {
                    onExport?.('pdf');
                    setShowExport(false);
                  }}
                  className="px-3 py-2 text-left text-sm rounded hover:bg-[#27272a] text-gray-300"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => {
                    onExport?.('docx');
                    setShowExport(false);
                  }}
                  className="px-3 py-2 text-left text-sm rounded hover:bg-[#27272a] text-gray-300"
                >
                  Export as DOCX
                </button>
                <button
                  onClick={() => {
                    onExport?.('txt');
                    setShowExport(false);
                  }}
                  className="px-3 py-2 text-left text-sm rounded hover:bg-[#27272a] text-gray-300"
                >
                  Export as TXT
                </button>
              </div>
            </Dropdown>
          </div>
        </div>

        <div className="flex-1" />

        {/* History */}
        <div className="flex items-center gap-0.5 opacity-50 hover:opacity-100 transition-opacity">
          <ToggleButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={14} strokeWidth={2.5} />
          </ToggleButton>
          <ToggleButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo size={14} strokeWidth={2.5} />
          </ToggleButton>
        </div>
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
    className={`p-2 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-[#f472b6] text-white shadow-[0_0_10px_rgba(244,114,182,0.4)]"
        : "text-[#a1a1aa] hover:bg-white/10 hover:text-white"
    } ${
      disabled ? "opacity-30 cursor-not-allowed" : "hover:scale-105 active:scale-95"
    }`}
  >
    {children}
  </button>
);

const Dropdown = ({
  show,
  onClose,
  children,
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) => {
  if (!show) return null;
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute top-full mt-2 z-20 bg-[#0a0a0a] rounded-xl shadow-2xl border border-[#27272a] p-3 min-w-[180px]">
        {children}
      </div>
    </>
  );
};
