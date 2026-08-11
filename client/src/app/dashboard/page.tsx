'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import UserMenu from '@/components/UserMenu'
import ThemeToggle from '@/components/ThemeToggle'
import NoteCard from '@/components/NoteCard'
import { FileText, Plus, Search, Archive, Menu, X, Folder, Trash2, Star, Settings, HelpCircle, LogOut, Loader2 } from 'lucide-react'
import CreateDocumentModal from '@/components/CreateDocumentModal'
import Starfield from '@/components/Starfield'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmationModal from '@/components/ConfirmationModal'

const APPEARANCE_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
] as const
import { Stagger, StaggerItem, Typewriter, PageEnter } from '@/components/motion'

interface Document {
  id: string;
  title: string;
  updatedAt: string;
  isArchived: boolean;
  isTrash: boolean;
  isFavorite: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content?: any;
}

type ViewType = 'all' | 'favorites' | 'archive' | 'trash';

const SidebarContent = ({ 
  currentView, 
  setCurrentView, 
  onCreateDocument, 
  onCreateFolder,
  onOpenSettings
}: { 
  currentView: ViewType; 
  setCurrentView: (view: ViewType) => void; 
  onCreateDocument: () => void; 
  onCreateFolder: () => void;
  onOpenSettings: () => void;
}) => (
  <div className="flex flex-col h-full p-6">
    {/* Logo */}
    <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => setCurrentView('all')}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f472b6] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-500/20">
        <FileText className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight">Zenith</h1>
        <p className="text-xs text-zinc-500 font-medium">Workspace</p>
      </div>
    </div>

    {/* Primary Actions */}
    <div className="space-y-2 mb-8">
      <button
        onClick={onCreateDocument}
        className="w-full group flex items-center gap-3 px-4 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl font-semibold hover:opacity-90 transition-all duration-300"
      >
        <div className="w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
          <Plus className="w-3 h-3" />
        </div>
        <span>New Note</span>
        <span className="ml-auto text-xs font-mono opacity-50 group-hover:opacity-100 transition-opacity">⌘N</span>
      </button>

      <button
        onClick={onCreateFolder}
        className="w-full group flex items-center gap-3 px-4 py-3 bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 rounded-xl font-semibold transition-all duration-300 mt-2"
      >
        <div className="w-5 h-5 rounded-full border-2 border-zinc-500 dark:border-zinc-400 flex items-center justify-center">
          <Folder className="w-3 h-3" />
        </div>
        <span>New Folder</span>
      </button>
      
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-700 dark:group-focus-within:text-white transition-colors" />
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full bg-transparent border border-zinc-300 dark:border-zinc-800 focus:border-[#f472b6] rounded-xl py-2.5 pl-12 pr-4 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:bg-zinc-100/80 dark:focus:bg-white/5 transition-all"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 dark:text-zinc-600 opacity-50 group-hover:opacity-100 transition-opacity">⌘S</span>
      </div>
      
      <button 
        onClick={() => setCurrentView('archive')}
        className={`w-full group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${currentView === 'archive' ? 'bg-zinc-900/10 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-900/5 dark:hover:bg-white/5'}`}
      >
        <Archive className="w-5 h-5" />
        <span className="font-medium">Archive</span>
      </button>
    </div>

    {/* Navigation Links */}
    <div className="space-y-1 mb-8">
      <button 
        onClick={() => setCurrentView('all')}
        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${currentView === 'all' ? 'bg-zinc-900/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-white/5'}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${currentView === 'all' ? 'bg-[#f472b6]' : 'bg-zinc-400 dark:bg-zinc-700'}`} />
        Dashboard
      </button>

      <h2 className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-6">Library</h2>
      
      <button 
        onClick={() => setCurrentView('all')}
        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${currentView === 'all' ? 'bg-zinc-900/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-white/5'}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${currentView === 'all' ? 'bg-[#f472b6]' : 'bg-zinc-400 dark:bg-zinc-700'}`} />
        All Notes
      </button>

      <button 
        onClick={() => setCurrentView('favorites')}
        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${currentView === 'favorites' ? 'bg-zinc-900/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-white/5'}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${currentView === 'favorites' ? 'bg-yellow-400' : 'bg-zinc-400 dark:bg-zinc-700'}`} />
        Favorites
      </button>

      <button 
        onClick={() => setCurrentView('trash')}
        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${currentView === 'trash' ? 'bg-zinc-900/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-white/5'}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${currentView === 'trash' ? 'bg-red-500' : 'bg-zinc-400 dark:bg-zinc-700'}`} />
        Trash
      </button>
    </div>

    {/* Bottom Actions */}
    <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-white/5 space-y-1">
      <button 
        onClick={onOpenSettings}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-white/5 rounded-lg transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </button>
      <a
        href="https://github.com/Arnav112-l/Zenith-Collab#readme"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-white/5 rounded-lg transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Help & Support</span>
      </a>
    </div>
  </div>
)

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentView, setCurrentView] = useState<ViewType>('all')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createModalType, setCreateModalType] = useState('TEXT')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setThemeMounted(true)
  }, [])
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const fetchDocuments = async () => {
    try {
      let url = '/api/documents/list'
      if (currentView !== 'all') {
        url += `?type=${currentView}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }

  useEffect(() => {
    void fetchDocuments()
  }, [router, currentView])

  const createDocument = async () => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document', type: 'TEXT' }),
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        console.error('Failed to create document:', res.statusText)
        return
      }

      const data = await res.json()
      router.push(`/documents/${data.id}`)
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  const handleUpdateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        // Optimistic update or refetch
        fetchDocuments()
      }
    } catch (error) {
      console.error('Failed to update document:', error)
    }
  }

  const handleRename = (id: string, newTitle: string) => {
    handleUpdateDocument(id, { title: newTitle })
  }

  const handleArchive = (id: string) => {
    handleUpdateDocument(id, { isArchived: true, isTrash: false })
  }

  const handleFavorite = (id: string) => {
    // Toggle favorite
    const doc = documents.find(d => d.id === id)
    if (doc) {
      handleUpdateDocument(id, { isFavorite: !doc.isFavorite })
    }
  }

  const handleSoftDelete = (id: string) => {
    setConfirmation({
      isOpen: true,
      title: "Move to Trash?",
      message: "This document will be moved to trash. You can restore it later.",
      confirmText: "Move to Trash",
      isDangerous: true,
      onConfirm: () => handleUpdateDocument(id, { isTrash: true, isArchived: false })
    });
  }

  const handleRestore = (id: string) => {
    handleUpdateDocument(id, { isTrash: false, isArchived: false })
  }

  const handlePermanentDelete = async (id: string) => {
    setConfirmation({
      isOpen: true,
      title: "Delete Permanently?",
      message: "This action cannot be undone. This will permanently delete the note and all its content.",
      confirmText: "Delete Forever",
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/documents/${id}`, {
            method: 'DELETE',
          })

          if (res.ok) {
            setDocuments(docs => docs.filter(doc => doc.id !== id))
          }
        } catch (error) {
          console.error('Failed to delete document:', error)
        }
      }
    });
  }

  const openCreateModal = (type: string = 'TEXT') => {
    setCreateModalType(type)
    setShowCreateModal(true)
  }

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const noteColors = ['purple', 'orange', 'green', 'yellow']

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f472b6] animate-spin" />
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100 selection:bg-purple-500/30 overflow-hidden">
      <Starfield />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg active:bg-zinc-100 dark:active:bg-white/5"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg">Zenith</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-white/5 shadow-2xl transform transition-transform duration-300 ease-out">
            <SidebarContent 
              currentView={currentView}
              setCurrentView={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }}
              onCreateDocument={() => { openCreateModal('TEXT'); setIsMobileMenuOpen(false); }}
              onCreateFolder={() => { openCreateModal('FILES'); setIsMobileMenuOpen(false); }}
              onOpenSettings={() => { setShowSettings(true); setIsMobileMenuOpen(false); }}
            />
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-72 bg-white/70 dark:bg-zinc-900/30 border-r border-zinc-200 dark:border-white/5 backdrop-blur-xl z-10">
        <SidebarContent 
          currentView={currentView}
          setCurrentView={setCurrentView}
          onCreateDocument={() => openCreateModal('TEXT')}
          onCreateFolder={() => openCreateModal('FILES')}
          onOpenSettings={() => setShowSettings(true)}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen p-4 pt-20 lg:p-8 lg:pt-8 transition-all duration-300 relative z-0">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
                {currentView === 'all' ? (
                  <Typewriter
                    text={`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${session?.user?.name?.split(' ')[0] || 'there'}`}
                    className="inline text-zinc-900 dark:text-white"
                    cursorClassName="bg-[#f472b6]"
                  />
                ) : (
                  <>
                    {currentView === 'archive' && 'Archive'}
                    {currentView === 'trash' && 'Trash'}
                    {currentView === 'favorites' && 'Favorites'}
                  </>
                )}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {currentView === 'all' && "Here's what's happening with your projects today."}
                {currentView === 'archive' && "Archived documents are hidden from your main view."}
                {currentView === 'trash' && "Items in trash will be deleted after 30 days."}
                {currentView === 'favorites' && "Your most important documents."}
              </p>
            </div>
            
            <div className="flex items-center gap-4 self-start md:self-auto">
              <div className="hidden md:flex items-center gap-2">
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
          </div>

          {/* Notes Grid */}
          {filteredDocuments.length > 0 ? (
            <Stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDocuments.map((doc, index) => (
                <NoteCard
                  key={doc.id}
                  id={doc.id}
                  title={doc.title}
                  time={getTimeAgo(doc.updatedAt)}
                  snippet="Click to view and edit this document..."
                  color={noteColors[index % noteColors.length]}
                  isArchived={doc.isArchived}
                  isTrash={doc.isTrash}
                  isFavorite={doc.isFavorite}
                  onRename={handleRename}
                  onDelete={handleSoftDelete}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onFavorite={handleFavorite}
                  onPermanentDelete={handlePermanentDelete}
                />
              ))}
              
              {/* Create New Card (Only in 'all' view) */}
              {currentView === 'all' && (
                <StaggerItem>
                  <motion.button
                    onClick={() => openCreateModal('TEXT')}
                    className="group relative h-full min-h-[200px] w-full rounded-2xl border-2 border-dashed border-zinc-300 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700 bg-white/60 hover:bg-white dark:bg-zinc-900/20 dark:hover:bg-zinc-900/50 transition-all duration-300 flex flex-col items-center justify-center gap-4"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-200 group-hover:bg-zinc-300 dark:bg-zinc-800 dark:group-hover:bg-zinc-700 flex items-center justify-center transition-colors shadow-lg shadow-black/5 dark:shadow-black/20">
                      <Plus className="w-6 h-6 text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-white" />
                    </div>
                    <span className="font-medium text-zinc-600 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Create New Note</span>
                  </motion.button>
                </StaggerItem>
              )}
            </Stagger>
          ) : (
            <PageEnter className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 flex items-center justify-center mb-6 shadow-xl shadow-pink-500/5">
                {currentView === 'trash' ? <Trash2 className="w-10 h-10 text-zinc-500 dark:text-zinc-600" /> : 
                 currentView === 'archive' ? <Archive className="w-10 h-10 text-zinc-500 dark:text-zinc-600" /> :
                 currentView === 'favorites' ? <Star className="w-10 h-10 text-zinc-500 dark:text-zinc-600" /> :
                 <FileText className="w-10 h-10 text-zinc-500 dark:text-zinc-600" />}
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                {currentView === 'trash' ? 'Trash is empty' :
                 currentView === 'archive' ? 'No archived notes' :
                 currentView === 'favorites' ? 'No favorites yet' :
                 'No notes yet'}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-500 max-w-sm mb-8">
                {currentView === 'all' && 'Get started by creating your first note. Capture ideas, lists, and more.'}
              </p>
              {currentView === 'all' && (
                <motion.button
                  onClick={() => openCreateModal('TEXT')}
                  className="px-6 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl font-semibold hover:opacity-90 transition-all duration-300"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Create your first note
                </motion.button>
              )}
            </PageEnter>
          )}
        </div>
      </main>

      <CreateDocumentModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        initialType={createModalType}
      />

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        isDangerous={confirmation.isDangerous}
      />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-[#27272a] rounded-2xl shadow-2xl z-50 overflow-hidden text-zinc-900 dark:text-zinc-100"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between">
                <h2 id="settings-title" className="text-xl font-bold">Settings</h2>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-[#27272a] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Account</h3>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-[#27272a]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#f472b6] flex items-center justify-center font-bold text-white flex-shrink-0">
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{session?.user?.name || 'User'}</p>
                        <p className="text-xs text-zinc-500 truncate">{session?.user?.email || 'Not signed in'}</p>
                      </div>
                    </div>
                    <a
                      href="https://github.com/settings/profile"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-medium bg-zinc-200 hover:bg-zinc-300 dark:bg-[#27272a] dark:hover:bg-[#3f3f46] rounded-lg transition-colors"
                    >
                      Manage
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Appearance</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {APPEARANCE_OPTIONS.map((option) => {
                      const isActive = themeMounted && theme === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setTheme(option.id)}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-[#f472b6]/10 border-[#f472b6] text-[#f472b6]'
                              : 'bg-zinc-50 dark:bg-[#171717] border-zinc-200 dark:border-[#27272a] text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'
                          }`}
                          aria-pressed={isActive}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Active: {themeMounted ? (theme || 'system') : '…'}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-[#27272a]">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}


