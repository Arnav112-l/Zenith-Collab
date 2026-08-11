'use client'

import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { User, LogOut, LogIn, ChevronDown, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

export default function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (status === 'loading') {
    return <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] animate-pulse" />
  }

  if (!session) {
    return (
      <Link href="/login" className="ui-btn-primary">
        <LogIn className="h-4 w-4" />
        <span>Sign In</span>
      </Link>
    )
  }

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="ui-btn !rounded-full !pl-1 !pr-2 !py-1"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="ui-popover absolute right-0 mt-2 w-64 z-50 p-2"
            role="menu"
          >
            <div className="px-3 py-2.5 mb-1">
              <p className="text-sm font-semibold truncate">{session.user?.name}</p>
              <p className="text-xs ui-muted truncate">{session.user?.email}</p>
            </div>

            <div className="ui-divider my-1" />

            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider ui-muted">
              Appearance
            </p>
            <div className="grid grid-cols-3 gap-1 p-1 mb-1">
              {themeOptions.map(({ id, label, icon: Icon }) => {
                const active = mounted && theme === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                      active
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'ui-muted hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="ui-divider my-1" />

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="ui-menu-item !text-[var(--danger)] hover:!bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mt-0.5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>

            {mounted && (
              <p className="px-3 py-2 text-[10px] ui-muted">
                Using {resolvedTheme} theme
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
