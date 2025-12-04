import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'
import Image from '@tiptap/extension-image'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { IndexeddbPersistence } from 'y-indexeddb'
import { useEffect, useState } from 'react'
import EnhancedToolbar from './EnhancedToolbar'
import { useSession } from 'next-auth/react'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import { TextShimmer } from '@/components/ui/text-shimmer'

const COLORS = [
  '#958DF1',
  '#F98181',
  '#FBBC88',
  '#FAF594',
  '#70CFF8',
  '#94FADB',
  '#B9F18D',
]

const TiptapEditor = ({ 
  documentId, 
  readOnly, 
  provider, 
  ydoc 
}: { 
  documentId: string
  readOnly: boolean
  provider: HocuspocusProvider
  ydoc: Y.Doc 
}) => {
  const { data: session } = useSession()

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        history: false, // History is handled by Yjs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: provider as any,
        user: {
          name: session?.user?.name || 'Anonymous',
          color: COLORS[0], // Use deterministic color for initial render
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg prose-invert focus:outline-none min-h-[400px] w-full px-8 sm:px-12 md:px-16 py-6 text-gray-100',
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly)
    }
  }, [editor, readOnly])

  // Update user info when session loads
  useEffect(() => {
    if (editor && session?.user) {
      editor.commands.updateUser({
        name: session.user.name || 'Anonymous',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }
  }, [editor, session])

  if (!editor) {
    return null
  }

  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    const content = editor.getText();
    const html = editor.getHTML();

    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' });
      saveAs(blob, 'document.txt');
    } else if (format === 'pdf') {
      const pdf = new jsPDF();
      const lines = pdf.splitTextToSize(content, 180);
      pdf.text(lines, 15, 15);
      pdf.save('document.pdf');
    } else if (format === 'docx') {
      const paragraphs = content.split('\n').map(text => 
        new Paragraph({
          children: [new TextRun(text)],
        })
      );
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, 'document.docx');
      });
    }
  };

  return (
    <div className="relative">
      {!readOnly && <EnhancedToolbar editor={editor} onExport={handleExport} />}
      <EditorContent editor={editor} />
    </div>
  )
}

const Editor = ({ documentId, readOnly = false, token }: { documentId: string; readOnly?: boolean; token: string }) => {
  const [status, setStatus] = useState('connecting')
  const [ydoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)

  useEffect(() => {
    // Set up Hocuspocus Provider (WebSocket)
    const wsProvider = new HocuspocusProvider({
      url: `ws://localhost:4000?token=${token}`,
      name: documentId,
      document: ydoc,
      onStatus: (event: { status: string }) => {
        console.log('DEBUG: WebSocket Status:', event.status)
        setStatus(event.status)
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // Avoid synchronous state update in effect
    setTimeout(() => setProvider(wsProvider), 0)

    // Set up IndexedDB Persistence (Offline Support)
    const indexeddbProvider = new IndexeddbPersistence(documentId, ydoc)
    indexeddbProvider.on('synced', () => {
      console.log('DEBUG: Content loaded from IndexedDB')
    })

    return () => {
      wsProvider.destroy()
      indexeddbProvider.destroy()
    }
  }, [ydoc, documentId, token])

  return (
    <div className="relative w-full h-full">
      {/* Notion-style minimal status bar */}
      <div className="absolute top-4 right-4 sm:right-8 md:right-12 lg:right-16 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a]/50 backdrop-blur-md rounded-full shadow-lg border border-[#27272a]/50 group hover:border-[#f472b6]/50 transition-colors">
          <div className="relative">
            <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
              status === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500'
            }`} />
            {status === 'connected' && (
              <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-green-500 animate-ping opacity-75" />
            )}
          </div>
          <span className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider group-hover:text-white transition-colors">
            {status === 'connected' ? 'Synced' : 'Syncing'}
          </span>
        </div>
        {readOnly && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#0a0a0a]/90 backdrop-blur-sm text-[#a1a1aa] shadow-sm border border-[#27272a]">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            View only
          </span>
        )}
      </div>

      {/* Clean editor container - Transparent to let parent glow show */}
      <div className="bg-transparent min-h-full">
        {provider ? (
          <TiptapEditor 
            documentId={documentId} 
            readOnly={readOnly} 
            provider={provider} 
            ydoc={ydoc} 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-16 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#f472b6] blur-xl opacity-20 animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[#27272a] shadow-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#27272a] border-t-[#f472b6]" />
              </div>
            </div>
            <TextShimmer 
              className="text-sm font-medium [--base-color:theme(colors.zinc.500)] [--base-gradient-color:theme(colors.zinc.200)]"
              duration={1.5}
            >
              Establishing secure connection...
            </TextShimmer>
          </div>
        )}
      </div>
    </div>
  )
}

export default Editor
