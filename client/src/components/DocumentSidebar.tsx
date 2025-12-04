"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { FileText, PlusCircle, Home, Trash2, CheckSquare, Square, FileType, Hash, Users, Clock, Folder, Search, Archive } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CreateDocumentModal from "./CreateDocumentModal";
import ConfirmationModal from "./ConfirmationModal";
import { EditorContext } from "@/contexts/EditorContext";

interface Document {
  id: string;
  title: string;
  updatedAt: string;
  userId: string;
}

interface DocumentLinkProps {
  doc: Document;
  currentDocId?: string;
  onDelete: (id: string) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

function DocumentLink({ doc, currentDocId, onDelete, isSelectionMode, isSelected, onToggleSelect }: DocumentLinkProps) {
  const { open } = useSidebar();
  const [showDelete, setShowDelete] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      onToggleSelect(doc.id);
    }
  };

  return (
    <div
      className="relative group/item"
      onMouseEnter={() => !isSelectionMode && setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {isSelectionMode ? (
        <div
          onClick={handleClick}
          className={cn(
            "flex items-center justify-start gap-2 py-2 pr-8 cursor-pointer hover:bg-[#27272a] rounded-lg transition-colors",
            isSelected && "bg-[#f472b6]/10"
          )}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 flex-shrink-0 text-[#f472b6]" />
          ) : (
            <Square className="h-5 w-5 flex-shrink-0 text-[#52525b]" />
          )}
          <motion.span
            animate={{
              display: open ? "inline-block" : "none",
              opacity: open ? 1 : 0,
            }}
            className="text-sm whitespace-pre inline-block !p-0 !m-0 truncate text-[#a1a1aa]"
          >
            {doc.title}
          </motion.span>
        </div>
      ) : (
        <Link
          href={`/documents/${doc.id}`}
          className={cn(
            "flex items-center justify-start gap-2 group/sidebar py-2 pr-8 rounded-lg transition-colors",
            currentDocId === doc.id ? "bg-[#f472b6]/10" : "hover:bg-[#27272a]"
          )}
        >
          <FileText className={cn(
            "h-5 w-5 flex-shrink-0",
            currentDocId === doc.id ? "text-[#f472b6]" : "text-[#52525b] group-hover/sidebar:text-[#a1a1aa]"
          )} />
          <motion.span
            animate={{
              display: open ? "inline-block" : "none",
              opacity: open ? 1 : 0,
            }}
            className={cn(
              "text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 truncate",
              currentDocId === doc.id ? "text-[#f472b6] font-medium" : "text-[#a1a1aa]"
            )}
          >
            {doc.title}
          </motion.span>
        </Link>
      )}
      {open && showDelete && !isSelectionMode && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(doc.id);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:bg-red-500/10 rounded opacity-0 group-hover/item:opacity-100 transition-opacity"
          title="Delete document"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Stats Display Component for Sidebar
function StatsDisplay({ documentId }: { documentId: string }) {
  const [stats, setStats] = useState({
    wordCount: 0,
    charCount: 0,
    collaborators: 1,
  });

  useEffect(() => {
    const updateStats = () => {
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement) {
        const text = editorElement.textContent || '';
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        setStats({
          wordCount: words.length,
          charCount: text.length,
          collaborators: 1,
        });
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [documentId]);

  const statItems = [
    { icon: FileType, label: 'Words', value: stats.wordCount.toLocaleString(), color: 'text-violet-400' },
    { icon: Hash, label: 'Characters', value: stats.charCount.toLocaleString(), color: 'text-orange-400' },
    { icon: Users, label: 'Collaborators', value: stats.collaborators.toString(), color: 'text-green-400' },
  ];

  return (
    <div className="space-y-2">
      {statItems.map((stat, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 px-3 py-2 bg-[#0a0a0a] rounded-lg border border-[#27272a]"
        >
          <stat.icon className={`h-4 w-4 ${stat.color}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#52525b]">{stat.label}</p>
            <p className="text-sm font-semibold text-white truncate">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DocumentSidebar({ currentDocId, showStats = false }: { currentDocId?: string; showStats?: boolean }) {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const editorContext = React.useContext(EditorContext);
  const activeEditorType = editorContext?.activeEditorType;
  const dispatchAction = editorContext?.dispatchAction;

  const handleModalSubmit = (data: { title: string; type: string }) => {
    if (activeEditorType === 'FILES' && dispatchAction) {
      dispatchAction('CREATE_FILE', { name: data.title, type: data.type });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents/list');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const createNewDocument = () => {
    console.log("createNewDocument called");
    setShowCreateModal(true);
  };

  const createNewFolder = () => {
    console.log("createNewFolder called");
    setNewFolderName("");
    setShowFolderInput(true);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newFolderName, type: "FILES" }),
      });

      if (!response.ok) throw new Error("Failed to create folder");

      const data = await response.json();
      router.push(`/documents/${data.id}`);
      setShowFolderInput(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteRequest = (docId: string) => {
    setDeleteConfirm(docId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await fetch(`/api/documents/${deleteConfirm}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove from list
        const remainingDocs = documents.filter(d => d.id !== deleteConfirm);
        setDocuments(remainingDocs);
        
        // If we deleted the current document, navigate to next available or create new
        if (currentDocId === deleteConfirm) {
          if (remainingDocs.length > 0) {
            // Navigate to the first available document
            router.push(`/documents/${remainingDocs[0].id}`);
          } else {
            // No documents left, create a new one
            setShowCreateModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedDocs(new Set());
  };

  const toggleSelectDoc = (docId: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedDocs(new Set(documents.map(d => d.id)));
  };

  const deselectAll = () => {
    setSelectedDocs(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;

    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/documents/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: Array.from(selectedDocs) })
      });

      if (res.ok) {
        const { deletedCount } = await res.json();
        
        // Remove deleted documents from list
        const remainingDocs = documents.filter(d => !selectedDocs.has(d.id));
        setDocuments(remainingDocs);
        
        // If current document was deleted, navigate to next available or create new
        if (currentDocId && selectedDocs.has(currentDocId)) {
          if (remainingDocs.length > 0) {
            // Navigate to the first available document
            router.push(`/documents/${remainingDocs[0].id}`);
          } else {
            // No documents left, create a new one
            setShowCreateModal(true);
          }
        }
        
        // Exit selection mode
        setIsSelectionMode(false);
        setSelectedDocs(new Set());
      }
    } catch (error) {
      console.error('Failed to bulk delete:', error);
    } finally {
      setIsBulkDeleting(false);
    }
  };



  return (
    <>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 bg-transparent">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            {open ? <Logo /> : <LogoIcon />}
            
            {/* Primary Actions */}
            <div className="mt-4 flex flex-col gap-2">
              <SidebarButton 
                link={{
                  label: "New Note",
                  icon: <PlusCircle className="text-black h-5 w-5" />,
                }}
                onClick={createNewDocument}
                className="bg-white hover:bg-neutral-200 text-black rounded-xl font-medium justify-center"
              />
              <SidebarButton 
                link={{
                  label: "New Folder",
                  icon: <Folder className="text-white h-5 w-5" />,
                }}
                onClick={createNewFolder}
                className="bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-xl font-medium"
              />
            </div>

            {/* Secondary Actions */}
            <div className="mt-2 flex flex-col gap-1">
              <SidebarButton 
                link={{
                  label: "Search",
                  icon: <Search className="text-[#52525b] h-4 w-4" />,
                }}
                onClick={() => {}} // TODO: Implement search
                className="bg-[#18181b] border border-[#27272a] text-[#a1a1aa] rounded-xl hover:bg-[#27272a]"
              />
              <SidebarButton 
                link={{
                  label: "Archive",
                  icon: <Archive className="text-[#52525b] h-5 w-5" />,
                }}
                onClick={() => {}} // TODO: Implement archive view
                className="hover:bg-[#27272a] text-[#a1a1aa] rounded-lg"
              />
            </div>

            {/* Navigation */}
            <div className="mt-6">
              <SidebarLink 
                link={{
                  label: "Dashboard",
                  href: "/dashboard",
                  icon: <div className="h-2 w-2 rounded-full bg-[#f472b6]" />,
                }}
                className="bg-[#27272a] rounded-lg text-white font-medium"
              />
            </div>

            {/* Library Section */}
            <div className="mt-6">
              <div className="px-2 mb-2 text-xs font-semibold text-[#52525b] uppercase tracking-wider">
                Library
              </div>
              <div className="flex flex-col gap-1">
                <SidebarLink 
                  link={{
                    label: "All Notes",
                    href: "/dashboard", // Or specific filter
                    icon: <div className="h-1.5 w-1.5 rounded-full bg-[#f472b6]" />,
                  }}
                  className="bg-[#27272a]/50 hover:bg-[#27272a] rounded-lg text-white"
                />
                <SidebarLink 
                  link={{
                    label: "Favorites",
                    href: "#",
                    icon: <div className="h-1.5 w-1.5 rounded-full bg-[#52525b]" />,
                  }}
                  className="hover:bg-[#27272a] rounded-lg text-[#a1a1aa]"
                />
                <SidebarLink 
                  link={{
                    label: "Trash",
                    href: "#",
                    icon: <div className="h-1.5 w-1.5 rounded-full bg-[#52525b]" />,
                  }}
                  className="hover:bg-[#27272a] rounded-lg text-[#a1a1aa]"
                />
              </div>
            </div>

            {/* Stats Section */}
            {showStats && currentDocId && open && (
              <div className="mt-6 mb-4">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="text-xs font-semibold text-[#52525b] uppercase tracking-wider mb-3">
                    Document Stats
                  </div>
                  <StatsDisplay documentId={currentDocId} />
                </motion.div>
              </div>
            )}

            {/* Documents Section */}
            {documents.length > 0 && (
              <>
                <div className="mt-6 mb-2 flex items-center justify-between">
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="text-xs font-semibold text-[#52525b] uppercase tracking-wider"
                  >
                    Recent Documents
                  </motion.span>
                  {open && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={toggleSelectionMode}
                      className={cn(
                        "text-xs px-2 py-1 rounded transition-colors",
                        isSelectionMode 
                          ? "bg-[#f472b6]/10 text-[#f472b6]" 
                          : "text-[#52525b] hover:bg-[#27272a]"
                      )}
                      title={isSelectionMode ? "Exit selection mode" : "Select multiple"}
                    >
                      {isSelectionMode ? "Cancel" : "Select"}
                    </motion.button>
                  )}
                </div>

                {/* Selection Mode Controls */}
                {isSelectionMode && open && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-2 flex items-center gap-2 text-xs"
                  >
                    <button
                      onClick={selectAll}
                      className="text-[#f472b6] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-[#52525b]">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-[#f472b6] hover:underline"
                    >
                      Deselect All
                    </button>
                    {selectedDocs.size > 0 && (
                      <>
                        <span className="text-[#52525b]">|</span>
                        <button
                          onClick={handleBulkDelete}
                          disabled={isBulkDeleting}
                          className="text-red-500 hover:underline disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete ({selectedDocs.size})
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                <div className="flex flex-col gap-1">
                  {documents.slice(0, 10).map((doc) => (
                    <DocumentLink
                      key={doc.id}
                      doc={doc}
                      currentDocId={currentDocId}
                      onDelete={handleDeleteRequest}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedDocs.has(doc.id)}
                      onToggleSelect={toggleSelectDoc}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div>
            <SidebarLink
              link={{
                label: session?.user?.name || "Guest User",
                href: "#",
                icon: session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    className="h-7 w-7 flex-shrink-0 rounded-full"
                    width={28}
                    height={28}
                    alt="Avatar"
                  />
                ) : (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-[#f472b6] flex items-center justify-center text-white text-xs font-bold">
                    {session?.user?.name?.charAt(0).toUpperCase() || "G"}
                  </div>
                ),
              }}
              className="hover:bg-[#27272a] rounded-lg transition-colors"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Create Document Modal */}
      <CreateDocumentModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSubmit={activeEditorType === 'FILES' ? handleModalSubmit : undefined}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document?"
        message="This action cannot be undone. This will permanently delete the document and remove all its content."
        confirmText="Delete"
        isDangerous={true}
      />
    </>
  );
}

const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-gradient-to-br from-[#f472b6] to-[#ec4899] rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-white whitespace-pre"
      >
        Zenith
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-gradient-to-br from-[#f472b6] to-[#ec4899] rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};

function SidebarButton({ link, className, onClick }: { link: any, className?: string, onClick: () => void }) {
  const { open, animate } = useSidebar();
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("SidebarButton clicked:", link.label);
        onClick();
      }}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left",
        className
      )}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </button>
  );
}
