'use client';

import { motion } from 'framer-motion';
import { Clock, MoreVertical, FileText, Trash, Edit2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface NoteCardProps {
  id: string;
  title: string;
  time: string;
  snippet: string;
  color: string;
  isArchived?: boolean;
  isTrash?: boolean;
  isFavorite?: boolean;
  tasks?: { text: string; completed: boolean }[];
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
}

export default function NoteCard({ 
  id, 
  title: initialTitle, 
  time, 
  snippet, 
  color, 
  isArchived,
  isTrash,
  isFavorite,
  tasks, 
  onRename, 
  onDelete,
  onArchive,
  onRestore,
  onFavorite,
  onPermanentDelete
}: NoteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRenaming]);

  const handleRenameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (title.trim() && title !== initialTitle) {
      onRename?.(id, title);
    } else {
      setTitle(initialTitle);
    }
    setIsRenaming(false);
  };

  const colorStyles: Record<string, string> = {
    purple: 'hover:border-purple-500/50 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)] group-hover:text-purple-400',
    orange: 'hover:border-orange-500/50 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)] group-hover:text-orange-400',
    green: 'hover:border-green-500/50 hover:shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)] group-hover:text-green-400',
    yellow: 'hover:border-yellow-500/50 hover:shadow-[0_0_30px_-10px_rgba(234,179,8,0.3)] group-hover:text-yellow-400',
  };

  const iconColors: Record<string, string> = {
    purple: 'text-purple-400 bg-purple-400/10',
    orange: 'text-orange-400 bg-orange-400/10',
    green: 'text-green-400 bg-green-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative group h-full"
    >
      <div className={`
        relative h-full p-5 rounded-2xl border border-white/5 
        bg-zinc-900/50 backdrop-blur-xl 
        transition-all duration-500 ease-out
        ${colorStyles[color]}
      `}>
        {/* Main Link Overlay */}
        {!isRenaming && !isTrash && (
          <Link 
            href={`/documents/${id}`} 
            className="absolute inset-0 z-0 rounded-2xl"
          />
        )}

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between mb-4 pointer-events-none">
          <div className="flex-1 min-w-0 mr-2 pointer-events-auto">
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-800/50 text-zinc-100 px-2 py-1 rounded border border-zinc-700 focus:outline-none focus:border-indigo-500 text-lg font-semibold"
                  onBlur={() => handleRenameSubmit()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setTitle(initialTitle);
                      setIsRenaming(false);
                    }
                  }}
                />
              </form>
            ) : (
              <div className="pointer-events-none"> {/* Allow click to pass through to Link */}
                <h3 className="font-semibold text-zinc-100 mb-1.5 truncate pr-2 text-lg">
                  {title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{time}</span>
                  {isFavorite && <span className="text-yellow-400 ml-2">★</span>}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative pointer-events-auto" ref={menuRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/10 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden">
                {!isTrash && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsRenaming(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFavorite?.(id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors"
                    >
                      <span className="w-4 h-4 flex items-center justify-center">{isFavorite ? '★' : '☆'}</span>
                      {isFavorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                    {!isArchived && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onArchive?.(id);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Archive
                      </button>
                    )}
                  </>
                )}

                {(isTrash || isArchived) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRestore?.(id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Restore
                  </button>
                )}

                <div className="my-1 h-px bg-white/10" />
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isTrash) {
                      onPermanentDelete?.(id);
                    } else {
                      onDelete?.(id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  {isTrash ? 'Delete Forever' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <p className="relative z-0 text-sm text-zinc-400 mb-6 line-clamp-2 leading-relaxed pointer-events-none">
          {snippet}
        </p>

        {/* Footer / Tasks */}
        {tasks && tasks.length > 0 ? (
          <div className="relative z-0 space-y-2 pt-4 border-t border-white/5 pointer-events-none">
            {tasks.slice(0, 2).map((task, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-zinc-500">
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  task.completed 
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400' 
                    : 'border-zinc-700'
                }`}>
                  {task.completed && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>
                <span className={task.completed ? 'line-through opacity-50' : ''}>{task.text}</span>
              </div>
            ))}
            {tasks.length > 2 && (
              <p className="text-xs text-zinc-600 pl-5.5">+{tasks.length - 2} more items</p>
            )}
          </div>
        ) : (
          <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColors[color]}`}>
              <FileText className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
