'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Github, Zap, Package, TestTube, Box, Server, FileCode, Lock, Wifi } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('server')

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const copyInstallCommand = () => {
    navigator.clipboard.writeText('npm install -g zenith')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const codeExamples = {
    server: `import { Zenith } from 'zenith';

const server = Zenith.serve({
  port: 3000,
  fetch(req) {
    return new Response("Collaborative editing!");
  }
});`,
    files: `import { readFile, writeFile } from 'zenith/fs';

const content = await readFile('note.md');
await writeFile('note.md', content + '\\n\\nEdited!');`,
    realtime: `import { createRoom } from 'zenith/realtime';

const room = createRoom('doc-123');
room.on('update', (changes) => {
  console.log('Document updated:', changes);
});`,
    websocket: `import { WebSocket } from 'zenith';

const ws = new WebSocket('ws://localhost:3000');
ws.on('message', (data) => {
  console.log('Received:', data);
});`
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-[#27272a]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f472b6] to-[#ec4899] flex items-center justify-center font-bold">
                N
              </div>
              <span className="font-bold text-lg">Zenith</span>
            </div>
            <span className="px-2 py-0.5 text-xs bg-[#27272a] text-[#a1a1aa] rounded-full">v1.0.0</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#" className="text-[#a1a1aa] hover:text-white transition-colors">Docs</a>
            <a href="#" className="text-[#a1a1aa] hover:text-white transition-colors">Blog</a>
            <a href="#" className="text-[#a1a1aa] hover:text-white transition-colors">Discord</a>
          </div>

          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-[#a1a1aa] hover:text-white cursor-pointer transition-colors" />
            <div className="hidden sm:block px-3 py-1.5 bg-[#0a0a0a] border border-[#27272a] rounded-md text-xs text-[#a1a1aa]">
              ⌘K Search
            </div>
            <button 
              onClick={() => router.push('/login')}
              className="px-4 py-1.5 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* 3D Bao Bun Visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 flex justify-center"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#f472b6] to-[#ec4899] flex items-center justify-center text-6xl shadow-[0_0_60px_-10px_rgba(244,114,182,0.5)]">
              📝
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Zenith is a fast all-in-one<br />collaborative editor
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-[#a1a1aa] max-w-2xl mx-auto mb-12"
          >
            Write, edit, collaborate, and share. Real-time synchronization with powerful rich-text editing. All in one.
          </motion.p>

          {/* Install Command Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <div className="bg-[#111] border border-[#27272a] rounded-xl p-4 flex items-center justify-between group hover:border-[#f472b6]/30 transition-colors">
              <code className="text-sm font-mono">
                <span className="text-cyan-400">npm</span>{' '}
                <span className="text-white">install -g</span>{' '}
                <span className="text-[#4ade80]">zenith</span>
              </code>
              <button
                onClick={copyInstallCommand}
                className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#4ade80]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#a1a1aa]" />
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benchmark Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Blazingly Fast Performance</h2>
            <p className="text-[#a1a1aa] text-lg">Real-time collaborative editing benchmarks</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Document Sync', zenith: 59000, competitor: 12000, unit: 'ops/s' },
              { label: 'Concurrent Edits', zenith: 45000, competitor: 8000, unit: 'edits/s' },
              { label: 'Startup Time', zenith: 120, competitor: 380, unit: 'ms', inverse: true }
            ].map((benchmark, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-[#0a0a0a] border border-[#27272a] rounded-2xl p-6"
              >
                <h3 className="text-sm text-[#a1a1aa] mb-6">{benchmark.label}</h3>
                
                {/* Zenith Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Zenith</span>
                    <span className="text-lg font-bold text-[#f472b6]">
                      {benchmark.zenith.toLocaleString()} <span className="text-xs text-[#a1a1aa]">{benchmark.unit}</span>
                    </span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: benchmark.inverse ? '30%' : '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-3 bg-gradient-to-r from-[#f472b6] to-[#ec4899] rounded-full shadow-[0_0_20px_-5px_rgba(244,114,182,0.5)]"
                  />
                </div>

                {/* Competitor Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#52525b]">Others</span>
                    <span className="text-sm text-[#52525b]">
                      {benchmark.competitor.toLocaleString()} <span className="text-xs">{benchmark.unit}</span>
                    </span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: benchmark.inverse ? '100%' : '20%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-3 bg-[#27272a] rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Four tools, one toolkit</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Zap, title: 'Real-time Sync', desc: 'Updates 3x faster than alternatives', color: '#4ade80' },
              { icon: Package, title: 'Rich Editor', desc: 'TipTap with 30+ extensions', color: '#f472b6' },
              { icon: Lock, title: 'Secure Sharing', desc: 'JWT-based authentication', color: '#facc15' },
              { icon: Wifi, title: 'Offline Mode', desc: 'Edit without connection', color: '#60a5fa' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#171717] border border-[#27272a]/50 rounded-xl p-6 hover:border-[#27272a] transition-colors group"
              >
                <feature.icon className="w-8 h-8 mb-4" style={{ color: feature.color }} />
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-[#a1a1aa]">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Baked In APIs Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">The APIs you need. Baked in.</h2>
          </motion.div>

          <div className="grid lg:grid-cols-[300px_1fr] gap-0 bg-[#0a0a0a] border border-[#27272a] rounded-2xl overflow-hidden">
            {/* Left Sidebar */}
            <div className="border-r border-[#27272a] p-6">
              <div className="space-y-1">
                {[
                  { id: 'server', icon: Server, label: 'Start a Server' },
                  { id: 'files', icon: FileCode, label: 'Read/Write Files' },
                  { id: 'realtime', icon: Zap, label: 'Real-time Sync' },
                  { id: 'websocket', icon: Wifi, label: 'WebSocket' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#f472b6]/10 text-[#f472b6] border border-[#f472b6]/20'
                        : 'text-[#a1a1aa] hover:text-white hover:bg-[#171717]'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Panel */}
            <div className="p-6">
              <pre className="font-mono text-sm text-[#a1a1aa] leading-relaxed">
                <code>{codeExamples[activeTab as keyof typeof codeExamples]}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#27272a] py-12 px-6 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold mb-3">Community</h3>
              <ul className="space-y-2 text-sm text-[#a1a1aa]">
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Help</h3>
              <ul className="space-y-2 text-sm text-[#a1a1aa]">
                <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-[#a1a1aa]">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">License</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Social</h3>
              <ul className="space-y-2 text-sm text-[#a1a1aa]">
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dev.to</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-[#52525b]">
            Designed with ❤️ for developers
          </div>
        </div>
      </footer>
    </div>
  )
}
