'use client'

import { useState, useMemo } from 'react'
import { Plus, Check, Trash2, Target, Trophy, ChevronDown, LayoutGrid, List, Calendar as CalendarIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'

interface GoalsEditorProps {
  content: string
  onChange: (value: string) => void
  readOnly?: boolean
}

interface Goal {
  id: string
  text: string
  completed: boolean // Legacy field, kept for compatibility
  type: 'daily' | 'weekly'
  target: number // e.g., 25 for daily, 4 for weekly
  history: Record<string, boolean> // Key: "YYYY-MM-DD" for daily, "YYYY-MM-Wn" for weekly
}

type ViewMode = 'simple' | 'tracker'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function GoalsEditor({ content, onChange, readOnly }: GoalsEditorProps) {
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const parsed = content ? JSON.parse(content) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [newGoal, setNewGoal] = useState('')
  const [goalType, setGoalType] = useState<'daily' | 'weekly'>('daily')
  const [viewMode, setViewMode] = useState<ViewMode>('tracker')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  const currentYear = new Date().getFullYear()

  const updateGoals = (newGoals: Goal[]) => {
    setGoals(newGoals)
    onChange(JSON.stringify(newGoals))
  }

  const addGoal = () => {
    if (!newGoal.trim()) return
    
    const goal: Goal = {
      id: crypto.randomUUID(),
      text: newGoal,
      completed: false,
      type: goalType,
      target: 0, // Default target is now 0 as requested
      history: {}
    }
    updateGoals([...goals, goal])
    setNewGoal('')
  }

  const deleteGoal = (id: string) => {
    if (readOnly) return
    updateGoals(goals.filter(g => g.id !== id))
  }

  const updateGoalTarget = (id: string, newTarget: number) => {
    if (readOnly) return
    updateGoals(goals.map(g => g.id === id ? { ...g, target: newTarget } : g))
  }

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const dailyGoals = goals.filter(g => g.type === 'daily')
    const weeklyGoals = goals.filter(g => g.type === 'weekly')

    // Calculate Daily Progress for Selected Month
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate()
    let dailyTotalDone = 0
    let dailyTotalTarget = 0

    dailyGoals.forEach(g => {
      let doneInMonth = 0
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        if (g.history[key]) doneInMonth++
      }
      dailyTotalDone += doneInMonth
      dailyTotalTarget += g.target // Target is per month
    })

    // Calculate Weekly Progress for Selected Month
    let weeklyTotalDone = 0
    let weeklyTotalTarget = 0
    
    weeklyGoals.forEach(g => {
      let doneInMonth = 0
      for (let w = 1; w <= 5; w++) {
        const key = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-W${w}`
        if (g.history[key]) doneInMonth++
      }
      weeklyTotalDone += doneInMonth
      weeklyTotalTarget += g.target
    })

    return {
      daily: { done: dailyTotalDone, target: Math.max(dailyTotalTarget, 1) }, // Avoid div by 0
      weekly: { done: weeklyTotalDone, target: Math.max(weeklyTotalTarget, 1) }
    }
  }, [goals, selectedMonth, currentYear])

  const renderDashboard = () => (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {/* Daily Progress Donut */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" /> Daily Habits
        </h3>
        <div className="h-40 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Done', value: stats.daily.done },
                  { name: 'Remaining', value: Math.max(0, stats.daily.target - stats.daily.done) }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill="#22c55e" />
                <Cell fill="#27272a" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">{Math.round((stats.daily.done / stats.daily.target) * 100)}%</span>
            <span className="text-xs text-zinc-500">Completed</span>
          </div>
        </div>
        <div className="flex justify-between w-full mt-4 text-sm px-4">
          <div className="text-center">
            <div className="text-zinc-400">Done</div>
            <div className="font-bold text-green-500">{stats.daily.done}</div>
          </div>
          <div className="text-center">
            <div className="text-zinc-400">Target</div>
            <div className="font-bold text-white">{stats.daily.target}</div>
          </div>
        </div>
      </div>

      {/* Weekly Progress Donut */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-500" /> Weekly Goals
        </h3>
        <div className="h-40 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Done', value: stats.weekly.done },
                  { name: 'Remaining', value: Math.max(0, stats.weekly.target - stats.weekly.done) }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill="#a855f7" />
                <Cell fill="#27272a" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">{Math.round((stats.weekly.done / stats.weekly.target) * 100)}%</span>
            <span className="text-xs text-zinc-500">Completed</span>
          </div>
        </div>
        <div className="flex justify-between w-full mt-4 text-sm px-4">
          <div className="text-center">
            <div className="text-zinc-400">Done</div>
            <div className="font-bold text-purple-500">{stats.weekly.done}</div>
          </div>
          <div className="text-center">
            <div className="text-zinc-400">Target</div>
            <div className="font-bold text-white">{stats.weekly.target}</div>
          </div>
        </div>
      </div>

      {/* Summary / Add Goal */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Quick Add</h3>
          <div className="space-y-4">
            <div className="relative">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 hover:border-zinc-600 transition-colors"
              >
                <span className="text-sm font-medium capitalize flex items-center gap-2">
                  {goalType === 'daily' ? <Target size={16} className="text-green-500"/> : <Trophy size={16} className="text-purple-500"/>}
                  {goalType} Goal
                </span>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showTypeDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowTypeDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-full bg-[#18181b] border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => { setGoalType('daily'); setShowTypeDropdown(false) }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-2"
                    >
                      <Target size={16} className="text-green-500"/> Daily Habit
                    </button>
                    <button
                      onClick={() => { setGoalType('weekly'); setShowTypeDropdown(false) }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-2"
                    >
                      <Trophy size={16} className="text-purple-500"/> Weekly Goal
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder={`New ${goalType} goal...`}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              />
              <button
                onClick={addGoal}
                disabled={!newGoal.trim()}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-zinc-500 text-center">
          Tip: You can edit targets directly in the grid.
        </div>
      </div>
    </div>
  )

  const renderSimpleView = () => {
    const today = new Date()
    // Ensure we are looking at the current month/year for "Today" context
    // If selectedMonth is different, we might want to warn or just show that month's "default" day?
    // For simplicity, "Simple View" always shows the *actual* Today.
    
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    // Estimate current week (1-5)
    const currentWeek = Math.ceil(today.getDate() / 7)
    const weekKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-W${currentWeek}`

    const dailyGoals = goals.filter(g => g.type === 'daily')
    const weeklyGoals = goals.filter(g => g.type === 'weekly')

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Daily Progress</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {Math.round((stats.daily.done / stats.daily.target) * 100)}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-full border-4 border-green-500/20 border-t-green-500 flex items-center justify-center">
                <Target size={16} className="text-green-500" />
              </div>
           </div>
           <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Weekly Progress</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {Math.round((stats.weekly.done / stats.weekly.target) * 100)}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-full border-4 border-purple-500/20 border-t-purple-500 flex items-center justify-center">
                <Trophy size={16} className="text-purple-500" />
              </div>
           </div>
        </div>

        {/* Daily Habits */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" /> 
              Today's Habits
              <span className="text-zinc-500 font-normal text-sm">
                ({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })})
              </span>
            </h3>
            <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">
              {dailyGoals.filter(g => g.history[todayKey]).length} / {dailyGoals.length}
            </span>
          </div>
          <div className="divide-y divide-zinc-800">
            {dailyGoals.map(goal => {
              const isDone = goal.history[todayKey]
              return (
                <div 
                  key={goal.id} 
                  onClick={() => {
                    if (readOnly) return
                    const newHistory = { ...goal.history, [todayKey]: !isDone }
                    updateGoals(goals.map(g => g.id === goal.id ? { ...g, history: newHistory } : g))
                  }}
                  className="group flex items-center gap-4 p-4 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isDone 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-zinc-700 group-hover:border-green-500/50'
                  }`}>
                    {isDone && <Check size={14} className="text-black stroke-[3]" />}
                  </div>
                  <span className={`flex-1 font-medium transition-colors ${
                    isDone ? 'text-zinc-500 line-through' : 'text-zinc-200'
                  }`}>
                    {goal.text}
                  </span>
                </div>
              )
            })}
            {dailyGoals.length === 0 && (
              <div className="p-8 text-center text-zinc-500 italic">
                No daily habits set. Switch to Tracker view to add some!
              </div>
            )}
          </div>
        </div>

        {/* Weekly Goals */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" /> 
              This Week's Goals
              <span className="text-zinc-500 font-normal text-sm">
                (Week {currentWeek})
              </span>
            </h3>
            <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">
              {weeklyGoals.filter(g => g.history[weekKey]).length} / {weeklyGoals.length}
            </span>
          </div>
          <div className="divide-y divide-zinc-800">
            {weeklyGoals.map(goal => {
              const isDone = goal.history[weekKey]
              return (
                <div 
                  key={goal.id} 
                  onClick={() => {
                    if (readOnly) return
                    const newHistory = { ...goal.history, [weekKey]: !isDone }
                    updateGoals(goals.map(g => g.id === goal.id ? { ...g, history: newHistory } : g))
                  }}
                  className="group flex items-center gap-4 p-4 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isDone 
                      ? 'bg-purple-500 border-purple-500' 
                      : 'border-zinc-700 group-hover:border-purple-500/50'
                  }`}>
                    {isDone && <Check size={14} className="text-black stroke-[3]" />}
                  </div>
                  <span className={`flex-1 font-medium transition-colors ${
                    isDone ? 'text-zinc-500 line-through' : 'text-zinc-200'
                  }`}>
                    {goal.text}
                  </span>
                </div>
              )
            })}
            {weeklyGoals.length === 0 && (
              <div className="p-8 text-center text-zinc-500 italic">
                No weekly goals set. Switch to Tracker view to add some!
              </div>
            )}
          </div>
        </div>

        {/* Quick Add (Reused from Dashboard but simplified) */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6">
           <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Quick Add Goal</h3>
           <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder="Add a new goal..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              />
              <select 
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as 'daily' | 'weekly')}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <button
                onClick={addGoal}
                disabled={!newGoal.trim()}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
           </div>
        </div>

      </div>
    )
  }

  const renderTrackerView = () => {
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate()
    const dailyGoals = goals.filter(g => g.type === 'daily')
    const weeklyGoals = goals.filter(g => g.type === 'weekly')

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {renderDashboard()}

        {/* Month Selector */}
        <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
          {MONTHS.map((month, idx) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(idx)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedMonth === idx
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
              }`}
            >
              {month}
            </button>
          ))}
        </div>

        {/* Daily Habits Grid */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 px-1">
            <Target className="w-5 h-5 text-green-500" /> Daily Habits (1-{daysInMonth})
          </h3>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider border-r border-zinc-800 min-w-[200px] sticky left-0 bg-[#18181b] z-20">
                      Goal Name
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider border-r border-zinc-800 min-w-[100px] sticky left-[200px] bg-[#18181b] z-20">
                      Progress
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider border-r border-zinc-800 min-w-[60px] sticky left-[300px] bg-[#18181b] z-20">
                      Target
                    </th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i} className="px-1 py-3 text-center text-xs font-medium text-zinc-500 border-r border-zinc-800 min-w-[36px] w-[36px]">
                        {i + 1}
                      </th>
                    ))}
                    <th className="px-2 py-3 min-w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {dailyGoals.map((goal) => {
                    let doneCount = 0
                    for (let d = 1; d <= daysInMonth; d++) {
                      if (goal.history[`${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`]) doneCount++
                    }
                    const progress = Math.min(100, Math.round((doneCount / (goal.target || 1)) * 100))

                    return (
                      <tr key={goal.id} className="group hover:bg-zinc-900/30 transition-colors">
                        <td className="px-4 py-2 text-white font-medium text-sm border-r border-zinc-800 sticky left-0 bg-[#18181b] group-hover:bg-[#18181b] z-10 whitespace-nowrap">
                          {goal.text}
                        </td>
                        <td className="px-2 py-2 border-r border-zinc-800 sticky left-[200px] bg-[#18181b] group-hover:bg-[#18181b] z-10">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-400 w-8 text-right">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 border-r border-zinc-800 sticky left-[300px] bg-[#18181b] group-hover:bg-[#18181b] z-10 text-center">
                          <input 
                            type="number"
                            value={goal.target}
                            onChange={(e) => updateGoalTarget(goal.id, parseInt(e.target.value) || 0)}
                            className="w-12 bg-transparent text-center text-zinc-400 focus:text-white focus:outline-none border-b border-transparent focus:border-green-500 transition-colors"
                          />
                        </td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dateKey = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                          const isChecked = goal.history[dateKey]
                          return (
                            <td key={i} className="p-0 border-r border-zinc-800 text-center relative h-[40px]">
                              <button
                                onClick={() => {
                                  if (readOnly) return
                                  const newHistory = { ...goal.history, [dateKey]: !isChecked }
                                  updateGoals(goals.map(g => g.id === goal.id ? { ...g, history: newHistory } : g))
                                }}
                                className={`w-full h-full flex items-center justify-center transition-colors hover:bg-zinc-800/50 ${
                                  isChecked ? 'bg-green-500/10' : ''
                                }`}
                              >
                                {isChecked && <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                                  <Check size={12} className="text-black stroke-[3]" />
                                </div>}
                              </button>
                            </td>
                          )
                        })}
                        <td className="px-2 text-center">
                          <button onClick={() => deleteGoal(goal.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {dailyGoals.length === 0 && (
                    <tr>
                      <td colSpan={daysInMonth + 4} className="px-4 py-8 text-center text-zinc-500 italic">
                        No daily habits yet. Add one above!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Weekly Goals Grid */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 px-1">
            <Trophy className="w-5 h-5 text-purple-500" /> Weekly Goals (W1-W5)
          </h3>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider border-r border-zinc-800 min-w-[200px] sticky left-0 bg-[#18181b] z-20">
                      Goal Name
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider border-r border-zinc-800 min-w-[100px] sticky left-[200px] bg-[#18181b] z-20">
                      Progress
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider border-r border-zinc-800 min-w-[60px] sticky left-[300px] bg-[#18181b] z-20">
                      Target
                    </th>
                    {Array.from({ length: 5 }, (_, i) => (
                      <th key={i} className="px-1 py-3 text-center text-xs font-medium text-zinc-500 border-r border-zinc-800 min-w-[60px]">
                        Week {i + 1}
                      </th>
                    ))}
                    <th className="px-2 py-3 min-w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {weeklyGoals.map((goal) => {
                    let doneCount = 0
                    for (let w = 1; w <= 5; w++) {
                      if (goal.history[`${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-W${w}`]) doneCount++
                    }
                    const progress = Math.min(100, Math.round((doneCount / (goal.target || 1)) * 100))

                    return (
                      <tr key={goal.id} className="group hover:bg-zinc-900/30 transition-colors">
                        <td className="px-4 py-2 text-white font-medium text-sm border-r border-zinc-800 sticky left-0 bg-[#18181b] group-hover:bg-[#18181b] z-10 whitespace-nowrap">
                          {goal.text}
                        </td>
                        <td className="px-2 py-2 border-r border-zinc-800 sticky left-[200px] bg-[#18181b] group-hover:bg-[#18181b] z-10">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-400 w-8 text-right">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 border-r border-zinc-800 sticky left-[300px] bg-[#18181b] group-hover:bg-[#18181b] z-10 text-center">
                          <input 
                            type="number"
                            value={goal.target}
                            onChange={(e) => updateGoalTarget(goal.id, parseInt(e.target.value) || 0)}
                            className="w-12 bg-transparent text-center text-zinc-400 focus:text-white focus:outline-none border-b border-transparent focus:border-purple-500 transition-colors"
                          />
                        </td>
                        {Array.from({ length: 5 }, (_, i) => {
                          const weekKey = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-W${i + 1}`
                          const isChecked = goal.history[weekKey]
                          return (
                            <td key={i} className="p-0 border-r border-zinc-800 text-center relative h-[40px]">
                              <button
                                onClick={() => {
                                  if (readOnly) return
                                  const newHistory = { ...goal.history, [weekKey]: !isChecked }
                                  updateGoals(goals.map(g => g.id === goal.id ? { ...g, history: newHistory } : g))
                                }}
                                className={`w-full h-full flex items-center justify-center transition-colors hover:bg-zinc-800/50 ${
                                  isChecked ? 'bg-purple-500/10' : ''
                                }`}
                              >
                                {isChecked && <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center">
                                  <Check size={14} className="text-black stroke-[3]" />
                                </div>}
                              </button>
                            </td>
                          )
                        })}
                        <td className="px-2 text-center">
                          <button onClick={() => deleteGoal(goal.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {weeklyGoals.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-zinc-500 italic">
                        No weekly goals yet. Add one above!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#0a0a0a] text-white p-6 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header & View Switcher */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Goals Tracker {currentYear}
            </h2>
            <p className="text-zinc-400">Track your daily habits and weekly goals</p>
          </div>
          
          <div className="flex bg-[#18181b] p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('simple')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'simple' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List size={16} />
              Simple
            </button>
            <button
              onClick={() => setViewMode('tracker')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'tracker' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={16} />
              Tracker
            </button>
          </div>
        </div>

        {viewMode === 'tracker' ? renderTrackerView() : renderSimpleView()}
      </div>
    </div>
  )
}
