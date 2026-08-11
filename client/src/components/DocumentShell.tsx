'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/components/motion'

export default function DocumentShell({
  header,
  children,
}: {
  header: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 relative z-10">
      <motion.header
        className="flex-shrink-0 px-6 pt-6 pb-2 relative z-50"
        initial="hidden"
        animate="show"
        variants={fadeUp}
      >
        {header}
      </motion.header>

      <motion.main
        className="flex-1 overflow-hidden px-6 pb-6 pt-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.main>
    </div>
  )
}
