'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import CodeEditor from '@/components/CodeEditor'

// Dynamic imports for editors that use browser-only APIs
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
}

export default function SpecializedEditorWrapper({ docType, content: initialContent, canEdit }: SpecializedEditorWrapperProps) {
  const [content, setContent] = useState(initialContent);

  const handleChange = (value: string | undefined) => {
    setContent(value || "");
    // Placeholder for save logic
    // In a real app, you would call an API to save the content here
    console.log('Content changed:', value)
  }

  switch (docType) {
    case 'CODE':
      return (
        <CodeEditor 
          content={content} 
          onChange={handleChange} 
          readOnly={!canEdit}
        />
      )
    case 'CANVAS':
      return (
        <CanvasEditor
          content={content}
          onChange={(val) => handleChange(val)}
          readOnly={!canEdit}
        />
      )
    case 'BUDGET':
      return (
        <BudgetEditor
          content={content}
          onChange={(val) => handleChange(val)}
          readOnly={!canEdit}
        />
      )
    case 'EXPENSE':
      return (
        <ExpenseEditor
          content={content}
          onChange={(val) => handleChange(val)}
          readOnly={!canEdit}
        />
      )
    case 'KANBAN':
      return (
        <KanbanEditor
          content={content}
          onChange={(val) => handleChange(val)}
          readOnly={!canEdit}
        />
      )
    case 'CALENDAR':
      return (
        <CalendarEditor
          content={content}
          onChange={(val) => handleChange(val)}
          readOnly={!canEdit}
        />
      )
    case 'TIMETRACKER':
      return (
        <TimeTrackerEditor
          content={content}
          onChange={(val) => handleChange(val)}
          readOnly={!canEdit}
        />
      )
    case 'GOALS':
      return (
        <GoalsEditor
          content={content}
          onChange={(val) => handleChange(val)}
          readOnly={!canEdit}
        />
      )
    case 'FILES':
      return (
        <FileManagerEditor
          content={content}
          onChange={(val) => handleChange(val)}
          readOnly={!canEdit}
        />
      )
    case 'AI':
      return (
        <AIAssistantEditor
          content={content}
          onChange={(val) => handleChange(val)}
          readOnly={!canEdit}
        />
      )
    default:
      return <div>Unsupported document type: {docType}</div>
  }
}
