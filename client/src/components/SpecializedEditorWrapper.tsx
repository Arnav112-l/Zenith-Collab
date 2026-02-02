'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import CodeEditor from '@/components/CodeEditor'

// Dynamic imports for editors that use browser-only APIs
const CollaborativeCodeEditor = dynamic(() => import('@/components/CollaborativeCodeEditor'), { ssr: false })
const CanvasEditor = dynamic(() => import('@/components/CanvasEditor'), { ssr: false })
const BudgetEditor = dynamic(() => import('@/components/BudgetEditor'), { ssr: false })
const ExpenseEditor = dynamic(() => import('@/components/ExpenseEditor'), { ssr: false })
const KanbanEditor = dynamic(() => import('@/components/KanbanEditor'), { ssr: false })
const CalendarEditor = dynamic(() => import('@/components/CalendarEditor'), { ssr: false })
const TimeTrackerEditor = dynamic(() => import('@/components/TimeTrackerEditor'), { ssr: false })
const GoalsEditor = dynamic(() => import('@/components/GoalsEditor'), { ssr: false })
const FileManagerEditor = dynamic(() => import('@/components/FileManagerEditor'), { ssr: false })
const AIAssistantEditor = dynamic(() => import('@/components/AIAssistantEditor'), { ssr: false })

interface SpecializedEditorWrapperProps {
  docType: string;
  content: string;
  canEdit: boolean;
  documentId: string;
  token?: string;
}

export default function SpecializedEditorWrapper({ docType, content: initialContent, canEdit, documentId, token }: SpecializedEditorWrapperProps) {
  const [content, setContent] = useState(initialContent);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContent = useRef(initialContent);

  // Debounced save function
  const saveContent = useCallback(async (newContent: string) => {
    if (newContent === lastSavedContent.current) return;
    
    setSyncStatus('syncing');
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
      
      if (response.ok) {
        lastSavedContent.current = newContent;
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setSyncStatus('error');
    }
  }, [documentId]);

  const handleChange = useCallback((value: string | undefined) => {
    const newContent = value || "";
    setContent(newContent);
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save - wait 1 second after last change
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(newContent);
    }, 1000);
  }, [saveContent]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Sync status indicator
  const SyncIndicator = () => (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a]/50 backdrop-blur-md rounded-full shadow-lg border border-[#27272a]/50">
      <div className="relative">
        <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
          syncStatus === 'synced' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
          syncStatus === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        {syncStatus === 'synced' && (
          <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>
      <span className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider">
        {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Saving...' : 'Error'}
      </span>
    </div>
  );

  const editorProps = {
    content,
    onChange: handleChange,
    readOnly: !canEdit,
  };

  switch (docType) {
    case 'CODE':
      // Use regular editor with auto-save - sync indicator is built into CodeEditor toolbar
      return (
        <CodeEditor 
          content={content}
          onChange={handleChange}
          readOnly={!canEdit}
          syncStatus={syncStatus}
        />
      )
    case 'CANVAS':
      return (
        <div className="relative h-full">
          <SyncIndicator />
          <CanvasEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </div>
      )
    case 'BUDGET':
      return (
        <div className="relative h-full">
          <SyncIndicator />
          <BudgetEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </div>
      )
    case 'EXPENSE':
      return (
        <div className="relative h-full">
          <SyncIndicator />
          <ExpenseEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </div>
      )
    case 'KANBAN':
      return (
        <div className="relative h-full">
          <SyncIndicator />
          <KanbanEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </div>
      )
    case 'CALENDAR':
      return (
        <div className="relative h-full">
          <SyncIndicator />
          <CalendarEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </div>
      )
    case 'TIMETRACKER':
      return (
        <div className="relative h-full">
          <SyncIndicator />
          <TimeTrackerEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </div>
      )
    case 'GOALS':
      return (
        <div className="relative h-full">
          <SyncIndicator />
          <GoalsEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </div>
      )
    case 'FILES':
      return (
        <div className="relative h-full">
          <SyncIndicator />
          <FileManagerEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </div>
      )
    case 'AI':
      return (
        <div className="relative h-full">
          <SyncIndicator />
          <AIAssistantEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </div>
      )
    default:
      return <div>Unsupported document type: {docType}</div>
  }
}
