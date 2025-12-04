'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { LampContainer } from '@/components/ui/lamp'
import { ArrowRight, FileText, Users, Zap } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (session) {
    return null
  }

  return (
    <LampContainer>
      <motion.div
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center px-4 w-full max-w-6xl mx-auto"
      >
        {/* Hero Section */}
        <div className="flex flex-col items-center max-w-4xl">
          <h1 className="bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl leading-tight">
            Collaborate in Real-Time <br /> with Zenith
          </h1>
          <p className="mt-8 text-center text-base md:text-lg text-slate-400 max-w-2xl px-4 leading-relaxed">
            Experience seamless collaborative note-taking with real-time editing, document sharing, and powerful formatting tools.
          </p>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <button
            onClick={() => router.push('/login')}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 min-w-[160px]"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 bg-slate-800 text-slate-200 font-semibold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all duration-300 min-w-[160px]"
          >
            Sign In
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 w-full max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center text-center p-7 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/50">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Real-Time Sync</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Changes sync instantly across all devices and collaborators
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center text-center p-7 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/50">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Team Collaboration</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Share documents and work together seamlessly
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-center text-center p-7 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-5 shadow-lg shadow-orange-500/50">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Rich Formatting</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Full-featured editor with tables, code blocks, and more
            </p>
          </motion.div>
        </div>
      </motion.div>
    </LampContainer>
  )
}
