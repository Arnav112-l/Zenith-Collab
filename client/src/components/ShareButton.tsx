'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Lock, Eye, Edit3, Link as LinkIcon, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface ShareButtonProps {
  documentId: string
  initialAccess: string
  isOwner: boolean
}

export default function ShareButton({
  documentId,
  initialAccess,
  isOwner,
}: ShareButtonProps) {
  const [access, setAccess] = useState(initialAccess)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const updateAccess = async (newAccess: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicAccess: newAccess }),
      })

      if (res.ok) {
        setAccess(newAccess)
        setIsOpen(false)
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to update access:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = async () => {
    const url = `${window.location.origin}/documents/${documentId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getAccessIcon = () => {
    switch (access) {
      case 'PRIVATE':
        return <Lock className="h-4 w-4" />
      case 'READ':
        return <Eye className="h-4 w-4" />
      case 'WRITE':
        return <Edit3 className="h-4 w-4" />
      default:
        return <Share2 className="h-4 w-4" />
    }
  }

  const getAccessLabel = () => {
    switch (access) {
      case 'PRIVATE':
        return 'Private'
      case 'READ':
        return 'View Only'
      case 'WRITE':
        return 'Can Edit'
      default:
        return 'Share'
    }
  }

  if (!isOwner && access === 'PRIVATE') return null

  const options = [
    {
      id: 'PRIVATE',
      label: 'Private',
      desc: 'Only you can access',
      icon: Lock,
    },
    {
      id: 'READ',
      label: 'View Only',
      desc: 'Anyone with the link can view',
      icon: Eye,
    },
    {
      id: 'WRITE',
      label: 'Can Edit',
      desc: 'Anyone with the link can edit',
      icon: Edit3,
    },
  ] as const

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-2">
        {isOwner && (
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="ui-btn"
          >
            {getAccessIcon()}
            <span className="hidden sm:inline">{getAccessLabel()}</span>
          </button>
        )}

        <button type="button" onClick={copyLink} className="ui-btn-primary">
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Copy Link</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="ui-popover absolute right-0 mt-2 w-72 z-50 p-2"
          >
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider ui-muted">
              Sharing
            </p>
            {options.map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                type="button"
                disabled={isLoading}
                data-active={access === id}
                onClick={() => updateAccess(id)}
                className="ui-menu-item disabled:opacity-50"
              >
                <Icon className="h-5 w-5 mt-0.5 ui-muted" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs ui-muted mt-0.5">{desc}</div>
                </div>
                {access === id && <Check className="h-4 w-4 text-[var(--accent)]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
