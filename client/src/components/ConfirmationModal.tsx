'use client'

import { AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="ui-panel relative w-full max-w-md rounded-2xl overflow-hidden"
          >
            <div className="p-6 flex flex-col items-center text-center">
              <div
                className={`mb-4 p-4 rounded-full ${
                  isDangerous
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                <AlertTriangle size={28} />
              </div>

              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="ui-muted leading-relaxed mb-8 max-w-xs">{message}</p>

              <div className="flex gap-3 w-full">
                <button type="button" onClick={onClose} className="ui-btn flex-1">
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                    isDangerous
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[var(--accent)] hover:brightness-105'
                  }`}
                >
                  {confirmText}
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 ui-btn-ghost !p-1.5"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
