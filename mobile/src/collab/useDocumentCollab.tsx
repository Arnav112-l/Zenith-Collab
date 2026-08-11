import { useEffect, useRef } from 'react'
import { config } from '../api/client'

/**
 * Connects to the Hocuspocus collab server for TEXT/CODE documents.
 * Provider is lazy-loaded so Yjs/lib0 never evaluate at cold start.
 */
export function useDocumentCollab({
  documentId,
  token,
  enabled,
}: {
  documentId?: string
  token: string | null
  enabled: boolean
}) {
  const providerRef = useRef<{ destroy: () => void } | null>(null)
  const docRef = useRef<{ destroy: () => void } | null>(null)

  useEffect(() => {
    if (!enabled || !documentId || !token) return

    let cancelled = false

    ;(async () => {
      const [{ HocuspocusProvider }, Y] = await Promise.all([
        import('@hocuspocus/provider'),
        import('yjs'),
      ])

      if (cancelled) return

      const ydoc = new Y.Doc()
      docRef.current = ydoc

      const provider = new HocuspocusProvider({
        url: config.wsUrl,
        name: documentId,
        document: ydoc,
        token,
      })
      providerRef.current = provider
    })().catch((err) => {
      console.warn('Collab connection failed', err)
    })

    return () => {
      cancelled = true
      providerRef.current?.destroy()
      docRef.current?.destroy()
      providerRef.current = null
      docRef.current = null
    }
  }, [documentId, token, enabled])

  return { providerRef, docRef }
}
