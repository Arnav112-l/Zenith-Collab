export type ThemeColors = {
  background: string
  foreground: string
  surface: string
  surface2: string
  border: string
  muted: string
  accent: string
  accentSoft: string
  danger: string
  card: string
}

export const lightColors: ThemeColors = {
  background: '#fafafa',
  foreground: '#18181b',
  surface: '#ffffff',
  surface2: '#f4f4f5',
  border: '#e4e4e7',
  muted: '#71717a',
  accent: '#ec4899',
  accentSoft: 'rgba(236,72,153,0.12)',
  danger: '#dc2626',
  card: '#ffffff',
}

export const darkColors: ThemeColors = {
  background: '#09090b',
  foreground: '#fafafa',
  surface: '#0a0a0a',
  surface2: '#18181b',
  border: '#27272a',
  muted: '#a1a1aa',
  accent: '#f472b6',
  accentSoft: 'rgba(244,114,182,0.12)',
  danger: '#f87171',
  card: '#0f0f12',
}

export const DOCUMENT_TYPES = [
  { id: 'TEXT', name: 'Notes', description: 'Rich text notes' },
  { id: 'CODE', name: 'Coding', description: 'Code with run support' },
  { id: 'CANVAS', name: 'Canvas', description: 'Draw and sketch' },
  { id: 'BUDGET', name: 'Budget', description: 'Monthly budgeting' },
  { id: 'EXPENSE', name: 'Expense', description: 'Track spending' },
  { id: 'KANBAN', name: 'Kanban', description: 'Task board' },
  { id: 'CALENDAR', name: 'Calendar', description: 'Events schedule' },
  { id: 'TIMETRACKER', name: 'Time Tracker', description: 'Log time' },
  { id: 'GOALS', name: 'Goals', description: 'Habit goals' },
  { id: 'FILES', name: 'Files', description: 'File manager' },
  { id: 'AI', name: 'AI Assistant', description: 'Chat helper' },
] as const

export type DocumentTypeId = (typeof DOCUMENT_TYPES)[number]['id']
