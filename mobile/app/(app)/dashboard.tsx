import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MotiView } from 'moti'
import { Screen, Button, Card, Input, Muted, Title } from '../../src/components/ui'
import { useTheme } from '../../src/theme/ThemeContext'
import { useAuth } from '../../src/auth/AuthContext'
import { apiFetch } from '../../src/api/client'
import { DOCUMENT_TYPES, DocumentTypeId } from '../../src/theme/colors'

type Doc = {
  id: string
  title: string
  updatedAt: string
  type: DocumentTypeId | string
  isArchived: boolean
  isTrash: boolean
  isFavorite: boolean
}

type ViewType = 'all' | 'favorites' | 'archive' | 'trash'

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function DashboardScreen() {
  const { colors } = useTheme()
  const { user, token } = useAuth()
  const [docs, setDocs] = useState<Doc[]>([])
  const [view, setView] = useState<ViewType>('all')
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedType, setSelectedType] = useState<DocumentTypeId>('TEXT')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    const typeParam =
      view === 'all' ? '' : view === 'favorites' ? '?type=favorites' : view === 'archive' ? '?type=archive' : '?type=trash'
    const data = await apiFetch<Doc[]>(`/api/documents/list${typeParam}`, { token })
    setDocs(data)
  }, [token, view])

  useEffect(() => {
    load().catch((e) => Alert.alert('Error', e.message))
  }, [load])

  const filtered = useMemo(
    () => docs.filter((d) => d.title.toLowerCase().includes(query.toLowerCase())),
    [docs, query]
  )

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  const createDoc = async () => {
    if (!token || !title.trim()) return
    try {
      setCreating(true)
      const data = await apiFetch<{ id: string }>('/api/documents', {
        method: 'POST',
        token,
        body: JSON.stringify({ title: title.trim(), type: selectedType }),
      })
      setCreateOpen(false)
      setTitle('')
      router.push(`/(app)/document/${data.id}`)
    } catch (e: any) {
      Alert.alert('Create failed', e.message)
    } finally {
      setCreating(false)
    }
  }

  const patchDoc = async (id: string, body: Record<string, unknown>) => {
    if (!token) return
    await apiFetch(`/api/documents/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    })
    await load()
  }

  const openActions = (doc: Doc) => {
    Alert.alert(doc.title, undefined, [
      {
        text: doc.isFavorite ? 'Unfavorite' : 'Favorite',
        onPress: () => patchDoc(doc.id, { isFavorite: !doc.isFavorite }),
      },
      {
        text: doc.isArchived ? 'Unarchive' : 'Archive',
        onPress: () => patchDoc(doc.id, { isArchived: !doc.isArchived, isTrash: false }),
      },
      {
        text: doc.isTrash ? 'Restore' : 'Move to trash',
        style: 'destructive',
        onPress: () =>
          patchDoc(doc.id, doc.isTrash ? { isTrash: false } : { isTrash: true, isArchived: false }),
      },
      {
        text: 'Delete forever',
        style: 'destructive',
        onPress: async () => {
          if (!token) return
          await apiFetch(`/api/documents/${doc.id}`, { method: 'DELETE', token })
          await load()
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const greeting = `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0] || 'there'}`

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Title>{view === 'all' ? greeting : view[0].toUpperCase() + view.slice(1)}</Title>
            <Muted>Your collaborative workspace</Muted>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/settings')}
            style={[styles.avatar, { backgroundColor: colors.accentSoft }]}
          >
            <Text style={{ color: colors.accent, fontWeight: '700' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.filters}>
          {(['all', 'favorites', 'archive', 'trash'] as ViewType[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              style={[
                styles.chip,
                {
                  backgroundColor: view === v ? colors.accentSoft : colors.surface2,
                  borderColor: view === v ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={{ color: view === v ? colors.accent : colors.muted, fontWeight: '600', fontSize: 12 }}>
                {v}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Input placeholder="Search notes" value={query} onChangeText={setQuery} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListEmptyComponent={
            <Card>
              <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 18 }}>No notes yet</Text>
              <Muted>Create your first notebook to get started.</Muted>
            </Card>
          }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 40 }}
            >
              <Pressable
                onPress={() => router.push(`/(app)/document/${item.id}`)}
                onLongPress={() => openActions(item)}
              >
                <Card>
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 17 }}>{item.title}</Text>
                  <Text style={{ color: colors.muted, marginTop: 6, fontSize: 12 }}>
                    {item.type} · {timeAgo(item.updatedAt)}
                    {item.isFavorite ? ' · ★' : ''}
                  </Text>
                </Card>
              </Pressable>
            </MotiView>
          )}
        />

        <View style={styles.fabWrap}>
          <Button label="New notebook" onPress={() => setCreateOpen(true)} />
        </View>

        <Modal visible={createOpen} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 20, marginBottom: 12 }}>
                Create notebook
              </Text>
              <Input placeholder="Notebook name" value={title} onChangeText={setTitle} />
              <View style={styles.typeGrid}>
                {DOCUMENT_TYPES.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => setSelectedType(t.id)}
                    style={[
                      styles.typeCard,
                      {
                        borderColor: selectedType === t.id ? colors.accent : colors.border,
                        backgroundColor: selectedType === t.id ? colors.accentSoft : colors.surface2,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{t.name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{t.description}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ gap: 10, marginTop: 12 }}>
                <Button label="Create" onPress={createDoc} loading={creating} disabled={!title.trim()} />
                <Button label="Cancel" variant="ghost" onPress={() => setCreateOpen(false)} />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  fabWrap: { position: 'absolute', left: 16, right: 16, bottom: 24 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  typeCard: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 10 },
})
