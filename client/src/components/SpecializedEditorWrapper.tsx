'use client'

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { PageEnter } from '@/components/motion'

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

function EditorEntrance({ children }: { children: ReactNode }) {
  return <PageEnter className="relative h-full">{children}</PageEnter>
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
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 ui-panel backdrop-blur-md rounded-full">
      <div className="relative">
        <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
          syncStatus === 'synced' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
          syncStatus === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        {syncStatus === 'synced' && (
          <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>
      <span className="text-[10px] font-medium ui-muted uppercase tracking-wider">
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
      if (!token) {
        return (
          <EditorEntrance>
            <div className="p-8 ui-muted">Missing collaboration token for code editor.</div>
          </EditorEntrance>
        )
      }
      return (
        <EditorEntrance>
          <CollaborativeCodeEditor
            documentId={documentId}
            readOnly={!canEdit}
            token={token}
          />
        </EditorEntrance>
      )
    case 'CANVAS':
      return (
        <EditorEntrance>
          <SyncIndicator />
          <CanvasEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </EditorEntrance>
      )
    case 'BUDGET':
      return (
        <EditorEntrance>
          <SyncIndicator />
          <BudgetEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </EditorEntrance>
      )
    case 'EXPENSE':
      return (
        <EditorEntrance>
          <SyncIndicator />
          <ExpenseEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </EditorEntrance>
      )
    case 'KANBAN':
      return (
        <EditorEntrance>
          <SyncIndicator />
          <KanbanEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </EditorEntrance>
      )
    case 'CALENDAR':
      return (
        <EditorEntrance>
          <SyncIndicator />
          <CalendarEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </EditorEntrance>
      )
    case 'TIMETRACKER':
      return (
        <EditorEntrance>
          <SyncIndicator />
          <TimeTrackerEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </EditorEntrance>
      )
    case 'GOALS':
      return (
        <EditorEntrance>
          <SyncIndicator />
          <GoalsEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </EditorEntrance>
      )
    case 'FILES':
      return (
        <EditorEntrance>
          <SyncIndicator />
          <FileManagerEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </EditorEntrance>
      )
    case 'AI':
      return (
        <EditorEntrance>
          <SyncIndicator />
          <AIAssistantEditor {...editorProps} onChange={(val) => handleChange(val)} />
        </EditorEntrance>
      )
    default:
      return (
        <EditorEntrance>
          <div>Unsupported document type: {docType}</div>
        </EditorEntrance>
      )
  }
}
