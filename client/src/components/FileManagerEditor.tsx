'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Folder, File, Upload, Trash2, Download, Search, 
  Grid, List, ChevronRight, MoreVertical, 
  ArrowLeft, Image as ImageIcon, Music, Video, FileText,
  CornerDownLeft, FolderPlus, FilePlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmationModal from './ConfirmationModal'
import { useEditorContext } from '@/contexts/EditorContext'

interface FileManagerEditorProps {
  content: string
  onChange: (value: string) => void
  readOnly?: boolean
}

interface FileItem {
  id: string
  parentId: string | null
  name: string
  type: 'file' | 'folder'
  size: string
  date: string
  content?: string
  mimeType?: string
}

export default function FileManagerEditor({ content, onChange, readOnly }: FileManagerEditorProps) {
  const [files, setFiles] = useState<FileItem[]>(() => {
    try {
      const parsed = content ? JSON.parse(content) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showFolderInput, setShowFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const { registerEditor, unregisterEditor } = useEditorContext()

  useEffect(() => {
    registerEditor('FILES', {
      createNewFile: (name: string, type: string) => {
        const newFile: FileItem = {
          id: crypto.randomUUID(),
          parentId: currentFolderId,
          name: name,
          type: 'file',
          size: '0 B',
          date: new Date().toLocaleDateString(),
          content: '',
          mimeType: 'text/plain'
        }
        // Use functional update to ensure fresh state if dependency is stale
        setFiles(prev => {
          const newFiles = [...prev, newFile]
          onChange(JSON.stringify(newFiles))
          return newFiles
        })
      },
      createNewFolder: (name: string) => {
        const newFolder: FileItem = {
          id: crypto.randomUUID(),
          parentId: currentFolderId,
          name: name,
          type: 'folder',
          size: '-',
          date: new Date().toLocaleDateString()
        }
        setFiles(prev => {
          const newFiles = [...prev, newFolder]
          onChange(JSON.stringify(newFiles))
          return newFiles
        })
      }
    })
    return () => unregisterEditor()
  }, [registerEditor, unregisterEditor, currentFolderId, onChange])

  const updateFiles = (newFiles: FileItem[]) => {
    setFiles(newFiles)
    onChange(JSON.stringify(newFiles))
  }

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const newFiles: FileItem[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      newFiles.push({
        id: crypto.randomUUID(),
        parentId: currentFolderId,
        name: file.name,
        type: 'file',
        size: formatSize(file.size),
        date: new Date().toLocaleDateString(),
        content: base64,
        mimeType: file.type
      })
    }

    updateFiles([...files, ...newFiles])
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const addFolder = () => {
    setNewFolderName('')
    setShowFolderInput(true)
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: FileItem = {
      id: crypto.randomUUID(),
      parentId: currentFolderId,
      name: newFolderName.trim(),
      type: 'folder',
      size: '-',
      date: new Date().toLocaleDateString()
    }
    
    updateFiles([...files, newFolder])
    setCurrentFolderId(newFolder.id) // Direct enter
    setShowFolderInput(false)
  }

  const deleteFile = (id: string) => {
    if (readOnly) return
    // Recursively delete children
    const getChildrenIds = (parentId: string): string[] => {
      const children = files.filter(f => f.parentId === parentId)
      return [...children.map(c => c.id), ...children.flatMap(c => c.type === 'folder' ? getChildrenIds(c.id) : [])]
    }
    
    const idsToDelete = [id, ...getChildrenIds(id)]
    updateFiles(files.filter(f => !idsToDelete.includes(f.id)))
    setDeleteConfirm(null)
  }

  const getBreadcrumbs = () => {
    const crumbs = []
    let current = currentFolderId
    
    while (current) {
      const folder = files.find(f => f.id === current)
      if (folder) {
        crumbs.unshift(folder)
        current = folder.parentId
      } else {
        break
      }
    }
    
    return [{ id: null, name: 'Home' }, ...crumbs]
  }

  const currentFiles = files.filter(f => 
    f.parentId === currentFolderId && 
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return <Folder className="w-full h-full text-[#f472b6]" />
    if (file.mimeType?.startsWith('image/')) return <ImageIcon className="w-full h-full text-cyan-400" />
    if (file.mimeType?.startsWith('video/')) return <Video className="w-full h-full text-purple-400" />
    if (file.mimeType?.startsWith('audio/')) return <Music className="w-full h-full text-green-400" />
    return <FileText className="w-full h-full text-blue-400" />
  }

  return (
    <div 
      className="h-full bg-[#0a0a0a] text-white flex flex-col relative overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (!readOnly) handleFileUpload(e.dataTransfer.files)
      }}
    >
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[100px]" />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        multiple
      />

      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between p-6 gap-4 border-b border-[#27272a] bg-[#0a0a0a]/50 backdrop-blur-xl">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-[#18181b] rounded-xl px-4 py-2.5 border border-[#27272a] shadow-inner focus-within:border-[#f472b6]/50 transition-colors">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="bg-transparent border-none focus:outline-none text-sm w-full text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-[#18181b] rounded-lg p-1 border border-[#27272a]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#27272a] text-[#f472b6] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#27272a] text-[#f472b6] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List size={18} />
            </button>
          </div>

          {!readOnly && (
            <>
              <div className="h-8 w-px bg-[#27272a] mx-2" />
              <button
                onClick={addFolder}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-xl transition-all border border-[#3f3f46] hover:border-[#52525b] shadow-lg shadow-black/20"
              >
                <FolderPlus size={18} className="text-[#f472b6]" />
                <span className="text-sm font-medium">New Folder</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#f472b6] hover:bg-[#ec4899] text-white rounded-xl transition-all shadow-[0_0_15px_rgba(244,114,182,0.3)] hover:shadow-[0_0_25px_rgba(244,114,182,0.5)]"
              >
                <Upload size={18} />
                <span className="text-sm font-medium">Upload</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="relative z-10 px-6 py-3 flex items-center gap-2 text-sm border-b border-[#27272a] bg-[#0a0a0a]/30 backdrop-blur-sm overflow-x-auto">
        {getBreadcrumbs().map((crumb, index, arr) => (
          <div key={crumb.id || 'home'} className="flex items-center gap-2 flex-shrink-0">
            {index > 0 && <ChevronRight size={14} className="text-zinc-600" />}
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
                index === arr.length - 1 
                  ? 'text-white font-medium bg-[#27272a]' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#27272a]/50'
              }`}
            >
              {index === 0 && <CornerDownLeft size={14} />}
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10" ref={containerRef}>
        {currentFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <div className="w-24 h-24 rounded-3xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <Folder size={48} className="opacity-20" />
            </div>
            <p className="text-lg font-medium text-zinc-400">This folder is empty</p>
            <p className="text-sm mt-2">Drag and drop files here to upload</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <AnimatePresence>
              {currentFiles.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`group relative aspect-[4/5] rounded-2xl p-4 flex flex-col items-center gap-3 transition-all duration-300 border ${
                    selectedId === file.id 
                      ? 'bg-[#27272a] border-[#f472b6] shadow-[0_0_20px_rgba(244,114,182,0.15)]' 
                      : 'bg-[#18181b]/50 border-[#27272a] hover:bg-[#27272a] hover:border-[#3f3f46] hover:shadow-xl hover:-translate-y-1'
                  }`}
                  onClick={() => setSelectedId(file.id)}
                  onDoubleClick={() => file.type === 'folder' && setCurrentFolderId(file.id)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id })
                  }}
                >
                  <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden rounded-xl bg-[#0a0a0a]/50 p-4">
                    {file.type === 'file' && file.mimeType?.startsWith('image/') && file.content ? (
                      <img src={file.content} alt={file.name} className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-16 h-16 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        {getFileIcon(file)}
                      </div>
                    )}
                  </div>
                  <div className="w-full text-center">
                    <p className="text-sm font-medium truncate w-full text-zinc-200 group-hover:text-white transition-colors">
                      {file.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{file.size}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-[#18181b]/50 border border-[#27272a] rounded-2xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#27272a]/50 text-zinc-400 font-medium uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {currentFiles.map((file) => (
                  <tr 
                    key={file.id}
                    className="hover:bg-[#27272a]/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedId(file.id)}
                    onDoubleClick={() => file.type === 'folder' && setCurrentFolderId(file.id)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id })
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 p-1.5 rounded-lg bg-[#0a0a0a] border border-[#27272a]">
                          {getFileIcon(file)}
                        </div>
                        <span className="text-zinc-200 group-hover:text-white transition-colors font-medium">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{file.size}</td>
                    <td className="px-6 py-4 text-zinc-500">{file.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.type === 'file' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); /* download logic */ }}
                            className="p-2 hover:bg-[#3f3f46] rounded-lg text-zinc-400 hover:text-white transition-colors"
                          >
                            <Download size={16} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(file.id) }}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#f472b6]/10 backdrop-blur-sm border-4 border-[#f472b6] border-dashed m-4 rounded-3xl flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-[#f472b6] shadow-[0_0_50px_rgba(244,114,182,0.3)] flex flex-col items-center gap-4">
              <Upload size={48} className="text-[#f472b6] animate-bounce" />
              <p className="text-xl font-bold text-white">Drop files to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl py-2 min-w-[160px] overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-[#27272a] hover:text-white transition-colors flex items-center gap-2"
            onClick={() => {
              // Rename logic
              setContextMenu(null)
            }}
          >
            <FileText size={14} /> Rename
          </button>
          <button 
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
            onClick={() => {
              setDeleteConfirm(contextMenu.fileId)
              setContextMenu(null)
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteFile(deleteConfirm)}
        title="Delete Item?"
        message="This action cannot be undone. The item and all its contents will be permanently deleted."
        confirmText="Delete"
        isDangerous={true}
      />

      {/* Create Folder Modal */}
      <AnimatePresence>
        {showFolderInput && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFolderInput(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl p-6 overflow-hidden"
            >
              <h3 className="text-lg font-bold text-white mb-4">New Folder</h3>
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                  if (e.key === 'Escape') setShowFolderInput(false)
                }}
                placeholder="Folder Name"
                className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f472b6] transition-colors mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFolderInput(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#f472b6] hover:bg-[#ec4899] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
