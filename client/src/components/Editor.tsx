import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useEffect, useState } from 'react'

const Editor = ({ documentId, readOnly = false, token }: { documentId: string; readOnly?: boolean; token: string }) => {
  console.log('DEBUG: Editor rendering', { documentId, readOnly, hasToken: !!token })
  const [status, setStatus] = useState('connecting')
  const [ydoc] = useState(() => new Y.Doc())

  useEffect(() => {
    const provider = new HocuspocusProvider({
      url: `ws://localhost:4000?token=${token}`,
      name: documentId,
      document: ydoc,
      onStatus: (event) => {
        console.log('DEBUG: WebSocket Status:', event.status)
        setStatus(event.status)
      },
    } as any)

    return () => {
      provider.destroy()
    }
  }, [ydoc, documentId, token])

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        history: false,
      } as any),
      Collaboration.configure({
        document: ydoc,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4 border rounded-md shadow-sm bg-white text-black',
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly)
    }
  }, [editor, readOnly])

  if (!editor) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Collaborative Editor</h2>
        <span className={`px-2 py-1 rounded text-xs ${status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {status}
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default Editor
