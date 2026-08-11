'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, Github } from 'lucide-react'
import Starfield from '@/components/Starfield'
import ThemeToggle from '@/components/ThemeToggle'
import { Stagger, StaggerItem, fadeIn, fadeUp } from '@/components/motion'

export default function Home() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [installTab, setInstallTab] = useState('linux')
  const [benchmarkTab, setBenchmarkTab] = useState('realtime')
  const [typedText, setTypedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  
  const textOptions = ['collaborative editor', 'note-taking app', 'document workspace']
  const [currentOption, setCurrentOption] = useState(0)

  // Typing animation
  useEffect(() => {
    const currentText = textOptions[currentOption]
    let index = 0
    let isDeleting = false
    let timeoutId: NodeJS.Timeout

    const type = () => {
      if (!isDeleting && index < currentText.length) {
        setTypedText(currentText.substring(0, index + 1))
        index++
        timeoutId = setTimeout(type, 100)
      } else if (!isDeleting && index === currentText.length) {
        timeoutId = setTimeout(() => {
          isDeleting = true
          type()
        }, 2000)
      } else if (isDeleting && index > 0) {
        setTypedText(currentText.substring(0, index - 1))
        index--
        timeoutId = setTimeout(type, 50)
      } else if (isDeleting && index === 0) {
        isDeleting = false
        setCurrentOption((prev) => (prev + 1) % textOptions.length)
        timeoutId = setTimeout(type, 500)
      }
    }

    type()
    return () => clearTimeout(timeoutId)
  }, [currentOption])

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  const copyInstallCommand = () => {
    const commands = {
      linux: 'git clone https://github.com/Arnav112-l/Zenith-Collab.git && cd Zenith-Collab/client && npm install',
      windows: 'git clone https://github.com/Arnav112-l/Zenith-Collab.git; cd Zenith-Collab/client; npm install',
    }
    navigator.clipboard.writeText(commands[installTab as keyof typeof commands])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const benchmarkData = {
    realtime: [
      { name: 'Zenith', version: 'v1.0.0', time: 45, color: '#f472b6' },
      { name: 'Google Docs', version: '', time: 180, color: '#6b7280' },
      { name: 'Notion', version: '', time: 220, color: '#6b7280' },
      { name: 'Quip', version: '', time: 350, color: '#6b7280' }
    ],
    sync: [
      { name: 'Zenith', version: 'v1.0.0', time: 12, color: '#f472b6' },
      { name: 'Dropbox Paper', version: '', time: 89, color: '#6b7280' },
      { name: 'Confluence', version: '', time: 145, color: '#6b7280' }
    ],
    load: [
      { name: 'Zenith', version: 'v1.0.0', time: 280, color: '#f472b6' },
      { name: 'Google Docs', version: '', time: 850, color: '#6b7280' },
      { name: 'Notion', version: '', time: 1200, color: '#6b7280' }
    ]
  }

  // if (session) {
  //   return null
  // }

  const maxTime = Math.max(...benchmarkData[benchmarkTab as keyof typeof benchmarkData].map(d => d.time))

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
      {/* Starfield Background */}
      <Starfield />

      {/* Navigation Bar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[color-mix(in_srgb,var(--background)_80%,transparent)] border-b border-[var(--border)]"
        initial="hidden"
        animate="show"
        variants={fadeIn}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f472b6] to-[#ec4899] flex items-center justify-center font-bold text-lg">
              Z
            </div>
            <span className="font-bold text-xl">Zenith</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-medium">Docs</a>
            <a href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-medium">Reference</a>
            <a href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-medium">Guides</a>
            <a href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-medium">Blog</a>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Github className="w-5 h-5 text-[var(--foreground)] hover:text-[var(--accent)] cursor-pointer transition-colors" />
            <motion.button 
              onClick={() => router.push('/login')}
              className="ui-btn-primary !rounded-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Side */}
            <Stagger className="space-y-8">
              {/* Version Badge */}
              <StaggerItem>
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-sm text-[#d1d5db] rounded-full transition-colors"
                >
                  Zenith v1.0.0 is here! →
                </button>
              </StaggerItem>

              {/* Hero Headline */}
              <StaggerItem>
                <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-4">
                  Zenith is a <span className="italic text-[#f472b6]">fast</span> collaborative
                </h1>
                <div className="flex items-center gap-3">
                  <h1 className="text-6xl md:text-7xl font-bold">
                    {typedText}
                    <span className={`inline-block w-1 h-16 ml-1 bg-white align-middle ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
                  </h1>
                </div>
              </StaggerItem>

              {/* Description */}
              <StaggerItem>
                <p className="text-lg text-[var(--muted)] leading-relaxed max-w-xl">
                  Zenith is a real-time collaborative workspace for notes, code, whiteboards, kanban boards, and more.
                  Edit together with live cursors, share documents with fine-grained permissions, and keep everything synced across your team.
                </p>
              </StaggerItem>

              {/* Quick Start */}
              <StaggerItem>
                <h3 className="text-xl font-bold mb-4">Quick Start</h3>
                
                {/* Tabs */}
                <div className="flex gap-0 mb-0">
                  <button
                    onClick={() => setInstallTab('linux')}
                    className={`px-6 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                      installTab === 'linux'
                        ? 'bg-[#1a1a1a] text-white border-[#f472b6]'
                        : 'bg-[var(--surface)] text-[#6b7280] border-transparent hover:text-[var(--foreground)]'
                    }`}
                  >
                    Linux & macOS
                  </button>
                  <button
                    onClick={() => setInstallTab('windows')}
                    className={`px-6 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                      installTab === 'windows'
                        ? 'bg-[#1a1a1a] text-white border-[#f472b6]'
                        : 'bg-[var(--surface)] text-[#6b7280] border-transparent hover:text-[var(--foreground)]'
                    }`}
                  >
                    Windows
                  </button>
                  <button className="px-6 py-2.5 text-sm font-medium bg-[var(--surface)] text-[#6b7280] hover:text-[var(--foreground)] transition-colors border-b-2 border-transparent">
                    View install script
                  </button>
                </div>

                {/* Command Box */}
                <div className="bg-[#1a1a1a] border-2 border-[#f472b6] rounded-lg p-4 font-mono text-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#f472b6]">&gt;</span>
                    <AnimatePresence mode="wait">
                      <motion.code
                        key={installTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="text-white"
                      >
                        {installTab === 'linux' ? (
                          <>
                            <span className="text-[#fbbf24]">git clone</span>{' '}
                            <span className="text-[#a78bfa]">https://github.com/Arnav112-l/Zenith-Collab.git</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[#fbbf24]">git clone</span>{' '}
                            <span className="text-[#a78bfa]">https://github.com/Arnav112-l/Zenith-Collab.git</span>
                          </>
                        )}
                      </motion.code>
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={copyInstallCommand}
                    className="p-2 hover:bg-[var(--surface-2)] rounded transition-colors flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#4ade80]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#6b7280] hover:text-[var(--foreground)]" />
                    )}
                  </button>
                </div>
              </StaggerItem>
            </Stagger>

            {/* Right Side - Benchmark */}
            <motion.div
              className="lg:sticky lg:top-32"
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-[var(--border)] bg-[#0f0f0f]">
                  <button
                    onClick={() => setBenchmarkTab('realtime')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      benchmarkTab === 'realtime'
                        ? 'text-[#f472b6] bg-[var(--surface)] border-b-2 border-[#f472b6]'
                        : 'text-[#6b7280] hover:text-[var(--foreground)]'
                    }`}
                  >
                    Real-time
                  </button>
                  <button
                    onClick={() => setBenchmarkTab('sync')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      benchmarkTab === 'sync'
                        ? 'text-[#f472b6] bg-[var(--surface)] border-b-2 border-[#f472b6]'
                        : 'text-[#6b7280] hover:text-[var(--foreground)]'
                    }`}
                  >
                    Sync Speed
                  </button>
                  <button
                    onClick={() => setBenchmarkTab('load')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      benchmarkTab === 'load'
                        ? 'text-[#f472b6] bg-[var(--surface)] border-b-2 border-[#f472b6]'
                        : 'text-[#6b7280] hover:text-[var(--foreground)]'
                    }`}
                  >
                    Load Time
                  </button>
                </div>

                {/* Chart */}
                <div className="p-6">
                  <h3 className="text-base font-semibold mb-1">
                    {benchmarkTab === 'realtime' && 'Real-time collaboration latency'}
                    {benchmarkTab === 'sync' && 'Document synchronization speed'}
                    {benchmarkTab === 'load' && 'Initial document load time'}
                  </h3>
                  <p className="text-xs text-[#6b7280] mb-6">Response time in milliseconds (lower is better)</p>

                  <div className="space-y-4">
                    {benchmarkData[benchmarkTab as keyof typeof benchmarkData].map((item, idx) => {
                      const percentage = (item.time / maxTime) * 100
                      return (
                        <motion.div
                          key={`${benchmarkTab}-${item.name}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.name}</span>
                              {item.version && (
                                <span className="text-xs text-[#6b7280]">{item.version}</span>
                              )}
                            </div>
                            <span className="text-sm font-mono tabular-nums">{item.time} ms</span>
                          </div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 + 0.2, ease: 'easeOut' }}
                            className="h-7 rounded-md"
                            style={{
                              backgroundColor: item.color,
                              boxShadow: item.color === '#f472b6' ? '0 0 15px rgba(244, 114, 182, 0.4)' : 'none'
                            }}
                          />
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


    </div>
  )
}
