'use client'

import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false })

export default function EditorWrapper({ documentId, readOnly, token }: { documentId: string; readOnly?: boolean; token: string }) {
  return <Editor documentId={documentId} readOnly={readOnly} token={token} />
}
