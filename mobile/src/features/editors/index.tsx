import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '../../theme/ThemeContext'
import { Button, Input } from '../../components/ui'
import { apiFetch } from '../../api/client'

type EditorProps = {
  content: string
  onChange: (value: string) => void
  readOnly?: boolean
  token?: string | null
}

function Shell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border }}>
      {children}
    </View>
  )
}

export function TextEditor({ content, onChange, readOnly }: EditorProps) {
  const { colors } = useTheme()
  return (
    <Shell>
      <TextInput
        multiline
        editable={!readOnly}
        value={content}
        onChangeText={onChange}
        placeholder="Start writing..."
        placeholderTextColor={colors.muted}
        textAlignVertical="top"
        style={{ flex: 1, padding: 16, color: colors.foreground, fontSize: 16, lineHeight: 24 }}
      />
    </Shell>
  )
}

export function CodeEditor({ content, onChange, readOnly, token }: EditorProps) {
  const { colors } = useTheme()
  const [lang, setLang] = useState('javascript')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const languages = ['javascript', 'python', 'typescript', 'java', 'cpp']

  const run = async () => {
    if (!token) {
      setOutput('Sign in to run code.')
      return
    }
    try {
      setRunning(true)
      const data = await apiFetch<any>('/api/execute', {
        method: 'POST',
        token,
        body: JSON.stringify({ language: lang, code: content }),
      })
      const out = [data.run?.stdout, data.run?.stderr].filter(Boolean).join('\n') || JSON.stringify(data)
      setOutput(out)
    } catch (e: any) {
      setOutput(e.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <Shell>
      <ScrollView horizontal style={{ maxHeight: 48, borderBottomWidth: 1, borderColor: colors.border }} contentContainerStyle={{ padding: 8, gap: 8 }}>
        {languages.map((l) => (
          <Pressable key={l} onPress={() => setLang(l)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: lang === l ? colors.accentSoft : colors.surface2 }}>
            <Text style={{ color: lang === l ? colors.accent : colors.muted, fontWeight: '600', fontSize: 12 }}>{l}</Text>
          </Pressable>
        ))}
        <Pressable onPress={run} style={{ marginLeft: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.accent }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{running ? 'Running…' : 'Run'}</Text>
        </Pressable>
      </ScrollView>
      <TextInput
        multiline
        editable={!readOnly}
        value={content}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical="top"
        style={{ flex: 1, padding: 12, color: colors.foreground, fontFamily: 'monospace', fontSize: 13 }}
      />
      <View style={{ borderTopWidth: 1, borderColor: colors.border, padding: 12, maxHeight: 140 }}>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 6 }}>OUTPUT</Text>
        <Text style={{ color: colors.foreground, fontFamily: 'monospace', fontSize: 12 }}>{output || '—'}</Text>
      </View>
    </Shell>
  )
}

export function CanvasEditor({ content, onChange, readOnly }: EditorProps) {
  const { colors } = useTheme()
  const [paths, setPaths] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(content || '{}')
      return Array.isArray(parsed.paths) ? parsed.paths : []
    } catch {
      return []
    }
  })
  const current = useRef<string>('')

  useEffect(() => {
    onChange(JSON.stringify({ paths, elements: [] }))
  }, [paths])

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !readOnly,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent
          current.current = `M${locationX},${locationY}`
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent
          current.current += ` L${locationX},${locationY}`
          setPaths((prev) => {
            const next = [...prev]
            if (next[next.length - 1]?.startsWith(current.current.slice(0, 8))) {
              next[next.length - 1] = current.current
            } else {
              next.push(current.current)
            }
            return [...next]
          })
        },
        onPanResponderRelease: () => {
          if (current.current) {
            setPaths((prev) => {
              const cleaned = prev.filter(Boolean)
              if (!cleaned.includes(current.current)) cleaned.push(current.current)
              return cleaned
            })
          }
          current.current = ''
        },
      }),
    [readOnly]
  )

  return (
    <Shell>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 8 }}>
        <Button label="Clear" variant="secondary" onPress={() => !readOnly && setPaths([])} />
      </View>
      <View style={{ flex: 1 }} {...pan.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke={colors.accent} strokeWidth={3} fill="none" strokeLinecap="round" />
          ))}
        </Svg>
      </View>
    </Shell>
  )
}

export function KanbanEditor({ content, onChange, readOnly }: EditorProps) {
  const { colors } = useTheme()
  const [data, setData] = useState(() => {
    try {
      const parsed = JSON.parse(content || '{}')
      if (parsed.columns && parsed.tasks) return parsed
    } catch {}
    return {
      columns: [
        { id: 'todo', title: 'To Do', taskIds: [] as string[] },
        { id: 'in-progress', title: 'In Progress', taskIds: [] as string[] },
        { id: 'done', title: 'Done', taskIds: [] as string[] },
      ],
      tasks: {} as Record<string, { id: string; title: string }>,
    }
  })
  const [draft, setDraft] = useState('')

  useEffect(() => {
    onChange(JSON.stringify(data))
  }, [data])

  const addTask = () => {
    if (readOnly || !draft.trim()) return
    const id = `t_${Date.now()}`
    setData((prev: any) => ({
      ...prev,
      tasks: { ...prev.tasks, [id]: { id, title: draft.trim() } },
      columns: prev.columns.map((c: any, i: number) =>
        i === 0 ? { ...c, taskIds: [...c.taskIds, id] } : c
      ),
    }))
    setDraft('')
  }

  const moveTask = (taskId: string, from: string, to: string) => {
    if (readOnly || from === to) return
    setData((prev: any) => ({
      ...prev,
      columns: prev.columns.map((c: any) => {
        if (c.id === from) return { ...c, taskIds: c.taskIds.filter((id: string) => id !== taskId) }
        if (c.id === to) return { ...c, taskIds: [...c.taskIds, taskId] }
        return c
      }),
    }))
  }

  return (
    <Shell>
      {!readOnly && (
        <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
          <Input style={{ flex: 1 }} placeholder="New task" value={draft} onChangeText={setDraft} />
          <Button label="Add" onPress={addTask} />
        </View>
      )}
      <ScrollView horizontal contentContainerStyle={{ padding: 12, gap: 12 }}>
        {data.columns.map((col: any) => (
          <View key={col.id} style={{ width: 260, backgroundColor: colors.surface2, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Text style={{ color: colors.foreground, fontWeight: '700', marginBottom: 10 }}>{col.title}</Text>
            {col.taskIds.map((id: string) => (
              <Pressable
                key={id}
                onLongPress={() => {
                  const next = data.columns.find((c: any) => c.id !== col.id)
                  if (next) moveTask(id, col.id, next.id)
                }}
                style={{ backgroundColor: colors.card, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ color: colors.foreground }}>{data.tasks[id]?.title || 'Untitled'}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>Long-press to move</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </Shell>
  )
}

export function CalendarEditorMobile({ content, onChange, readOnly }: EditorProps) {
  const { colors } = useTheme()
  const [events, setEvents] = useState<any[]>(() => {
    try {
      const parsed = JSON.parse(content || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [selected, setSelected] = useState(new Date().toISOString().slice(0, 10))
  const [title, setTitle] = useState('')

  useEffect(() => {
    onChange(JSON.stringify(events))
  }, [events])

  const marked = events.reduce((acc: any, e) => {
    const day = String(e.start || '').slice(0, 10)
    if (day) acc[day] = { marked: true, dotColor: colors.accent }
    return acc
  }, { [selected]: { selected: true, selectedColor: colors.accent } })

  return (
    <Shell>
      <Calendar
        onDayPress={(d: any) => setSelected(d.dateString)}
        markedDates={marked}
        theme={{
          backgroundColor: colors.surface,
          calendarBackground: colors.surface,
          dayTextColor: colors.foreground,
          monthTextColor: colors.foreground,
          arrowColor: colors.accent,
          textDisabledColor: colors.muted,
        }}
      />
      {!readOnly && (
        <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
          <Input style={{ flex: 1 }} placeholder="Event title" value={title} onChangeText={setTitle} />
          <Button
            label="Add"
            onPress={() => {
              if (!title.trim()) return
              setEvents((prev) => [
                ...prev,
                {
                  id: String(Date.now()),
                  title: title.trim(),
                  start: `${selected}T09:00:00`,
                  end: `${selected}T10:00:00`,
                },
              ])
              setTitle('')
            }}
          />
        </View>
      )}
      <FlatList
        data={events.filter((e) => String(e.start).startsWith(selected))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListEmptyComponent={<Text style={{ color: colors.muted, padding: 12 }}>No events this day</Text>}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{item.title}</Text>
          </View>
        )}
      />
    </Shell>
  )
}

export function BudgetEditor({ content, onChange, readOnly }: EditorProps) {
  const { colors } = useTheme()
  const [data, setData] = useState(() => {
    try {
      const parsed = JSON.parse(content || '{}')
      return {
        monthlyIncome: parsed.monthlyIncome || 0,
        categories: parsed.categories || [],
        currency: parsed.currency || 'USD',
      }
    } catch {
      return { monthlyIncome: 0, categories: [], currency: 'USD' }
    }
  })
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    onChange(JSON.stringify(data))
  }, [data])

  const spent = data.categories.reduce((s: number, c: any) => s + (c.spentAmount || 0), 0)

  return (
    <Shell>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: colors.foreground, fontWeight: '700' }}>Monthly income</Text>
        <Input
          editable={!readOnly}
          keyboardType="numeric"
          value={String(data.monthlyIncome || '')}
          onChangeText={(v) => setData((d) => ({ ...d, monthlyIncome: Number(v) || 0 }))}
        />
        <Text style={{ color: colors.muted }}>Spent: {spent} / {data.monthlyIncome}</Text>
        {!readOnly && (
          <View style={{ gap: 8 }}>
            <Input placeholder="Category" value={name} onChangeText={setName} />
            <Input placeholder="Allocated" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <Button
              label="Add category"
              onPress={() => {
                if (!name.trim()) return
                setData((d) => ({
                  ...d,
                  categories: [
                    ...d.categories,
                    {
                      id: String(Date.now()),
                      name: name.trim(),
                      allocatedAmount: Number(amount) || 0,
                      spentAmount: 0,
                      color: colors.accent,
                    },
                  ],
                }))
                setName('')
                setAmount('')
              }}
            />
          </View>
        )}
        {data.categories.map((c: any) => (
          <View key={c.id} style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surface2 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{c.name}</Text>
            <Text style={{ color: colors.muted }}>{c.spentAmount || 0} / {c.allocatedAmount}</Text>
          </View>
        ))}
      </ScrollView>
    </Shell>
  )
}

export function ExpenseEditor({ content, onChange, readOnly }: EditorProps) {
  const { colors } = useTheme()
  const [data, setData] = useState(() => {
    try {
      const parsed = JSON.parse(content || '{}')
      return {
        categories: parsed.categories || [{ id: '1', name: 'General', color: '#f472b6' }],
        expenses: parsed.expenses || [],
        currency: parsed.currency || 'USD',
      }
    } catch {
      return { categories: [{ id: '1', name: 'General', color: '#f472b6' }], expenses: [], currency: 'USD' }
    }
  })
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    onChange(JSON.stringify(data))
  }, [data])

  return (
    <Shell>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {!readOnly && (
          <>
            <Input placeholder="Description" value={desc} onChangeText={setDesc} />
            <Input placeholder="Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <Button
              label="Add expense"
              onPress={() => {
                if (!desc.trim() || !amount) return
                setData((d) => ({
                  ...d,
                  expenses: [
                    {
                      id: String(Date.now()),
                      categoryId: d.categories[0]?.id,
                      amount: Number(amount),
                      description: desc.trim(),
                      date: new Date().toISOString().slice(0, 10),
                    },
                    ...d.expenses,
                  ],
                }))
                setDesc('')
                setAmount('')
              }}
            />
          </>
        )}
        {data.expenses.map((e: any) => (
          <View key={e.id} style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surface2 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{e.description}</Text>
            <Text style={{ color: colors.muted }}>{e.amount} · {e.date}</Text>
          </View>
        ))}
      </ScrollView>
    </Shell>
  )
}

export function GoalsEditor({ content, onChange, readOnly }: EditorProps) {
  const { colors } = useTheme()
  const [goals, setGoals] = useState<any[]>(() => {
    try {
      const parsed = JSON.parse(content || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [text, setText] = useState('')

  useEffect(() => {
    onChange(JSON.stringify(goals))
  }, [goals])

  return (
    <Shell>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {!readOnly && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input style={{ flex: 1 }} placeholder="New goal" value={text} onChangeText={setText} />
            <Button
              label="Add"
              onPress={() => {
                if (!text.trim()) return
                setGoals((g) => [
                  ...g,
                  { id: String(Date.now()), text: text.trim(), completed: false, type: 'daily', target: 1, history: {} },
                ])
                setText('')
              }}
            />
          </View>
        )}
        {goals.map((g) => (
          <Pressable
            key={g.id}
            onPress={() =>
              !readOnly &&
              setGoals((all) => all.map((x) => (x.id === g.id ? { ...x, completed: !x.completed } : x)))
            }
            style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surface2 }}
          >
            <Text style={{ color: colors.foreground, textDecorationLine: g.completed ? 'line-through' : 'none' }}>
              {g.completed ? '✓ ' : '○ '}
              {g.text}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Shell>
  )
}

export function TimeTrackerEditor({ content, onChange, readOnly }: EditorProps) {
  const { colors } = useTheme()
  const [entries, setEntries] = useState<any[]>(() => {
    try {
      const parsed = JSON.parse(content || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [active, setActive] = useState<any | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [desc, setDesc] = useState('')

  useEffect(() => {
    onChange(JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - active.startTime) / 1000)), 1000)
    return () => clearInterval(id)
  }, [active])

  const format = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':')
  }

  return (
    <Shell>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: colors.foreground, fontSize: 36, fontWeight: '800', textAlign: 'center' }}>
          {format(elapsed)}
        </Text>
        {!readOnly && (
          <>
            <Input placeholder="What are you working on?" value={desc} onChangeText={setDesc} />
            <Button
              label={active ? 'Stop' : 'Start'}
              onPress={() => {
                if (!active) {
                  setActive({ id: String(Date.now()), description: desc || 'Session', startTime: Date.now(), duration: 0 })
                  setElapsed(0)
                } else {
                  const duration = Math.floor((Date.now() - active.startTime) / 1000)
                  setEntries((e) => [{ ...active, endTime: Date.now(), duration }, ...e])
                  setActive(null)
                  setElapsed(0)
                  setDesc('')
                }
              }}
            />
          </>
        )}
        {entries.map((e) => (
          <View key={e.id} style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surface2 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{e.description}</Text>
            <Text style={{ color: colors.muted }}>{format(e.duration || 0)}</Text>
          </View>
        ))}
      </View>
    </Shell>
  )
}

export function FilesEditor({ content, onChange, readOnly }: EditorProps) {
  const { colors } = useTheme()
  const [files, setFiles] = useState<any[]>(() => {
    try {
      const parsed = JSON.parse(content || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [name, setName] = useState('')

  useEffect(() => {
    onChange(JSON.stringify(files))
  }, [files])

  return (
    <Shell>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {!readOnly && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input style={{ flex: 1 }} placeholder="File or folder name" value={name} onChangeText={setName} />
            <Button
              label="Add"
              onPress={() => {
                if (!name.trim()) return
                setFiles((f) => [
                  {
                    id: String(Date.now()),
                    parentId: null,
                    name: name.trim(),
                    type: name.includes('.') ? 'file' : 'folder',
                    size: '0 KB',
                    date: new Date().toISOString(),
                  },
                  ...f,
                ])
                setName('')
              }}
            />
          </View>
        )}
        {files.map((f) => (
          <View key={f.id} style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surface2 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>
              {f.type === 'folder' ? '📁' : '📄'} {f.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Shell>
  )
}

export function AIEditor({ content, onChange, readOnly, token }: EditorProps) {
  const { colors } = useTheme()
  const [messages, setMessages] = useState<any[]>(() => {
    try {
      const parsed = JSON.parse(content || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    onChange(JSON.stringify(messages))
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading || readOnly) return
    const next = [...messages, { role: 'user', content: input.trim() }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const data = await apiFetch<{ content: string }>('/api/ai/chat', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({ messages: next }),
      })
      setMessages([...next, { role: 'assistant', content: data.content }])
    } catch (e: any) {
      Alert.alert('AI error', e.message)
      setMessages(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Ask Zenith AI anything</Text>}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: item.role === 'user' ? colors.accentSoft : colors.surface2,
              padding: 12,
              borderRadius: 14,
              maxWidth: '85%',
            }}
          >
            <Text style={{ color: colors.foreground }}>{item.content}</Text>
          </View>
        )}
      />
      {!readOnly && (
        <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderColor: colors.border }}>
          <Input style={{ flex: 1 }} placeholder="Message" value={input} onChangeText={setInput} />
          <Button label={loading ? '…' : 'Send'} onPress={send} />
        </View>
      )}
    </Shell>
  )
}

export function renderEditor(type: string, props: EditorProps) {
  switch (type) {
    case 'CODE':
      return <CodeEditor {...props} />
    case 'CANVAS':
      return <CanvasEditor {...props} />
    case 'KANBAN':
      return <KanbanEditor {...props} />
    case 'CALENDAR':
      return <CalendarEditorMobile {...props} />
    case 'BUDGET':
      return <BudgetEditor {...props} />
    case 'EXPENSE':
      return <ExpenseEditor {...props} />
    case 'GOALS':
      return <GoalsEditor {...props} />
    case 'TIMETRACKER':
      return <TimeTrackerEditor {...props} />
    case 'FILES':
      return <FilesEditor {...props} />
    case 'AI':
      return <AIEditor {...props} />
    case 'TEXT':
    default:
      return <TextEditor {...props} />
  }
}
