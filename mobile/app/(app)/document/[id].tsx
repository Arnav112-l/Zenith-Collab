import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Screen, Button, Input } from '../../../src/components/ui'
import { useTheme } from '../../../src/theme/ThemeContext'
import { useAuth } from '../../../src/auth/AuthContext'
import { apiFetch } from '../../../src/api/client'
import { renderEditor } from '../../../src/features/editors'
import { useDocumentCollab } from '../../../src/collab/useDocumentCollab'

type DocDetail = {
  id: string
  title: string
  type: string
  content: string
  publicAccess: string
  canEdit: boolean
  isOwner: boolean
}

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { token } = useAuth()
  const [doc, setDoc] = useState<DocDetail | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [collabToken, setCollabToken] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    if (!token || !id) return
    setLoading(true)
    try {
      const data = await apiFetch<DocDetail>(`/api/documents/${id}`, { token })
      setDoc(data)
      setTitle(data.title)
      setContent(data.content || '')
      if (data.type === 'TEXT' || data.type === 'CODE') {
        try {
          const tok = await apiFetch<{ token: string }>(`/api/documents/${id}/token`, {
            method: 'POST',
            token,
          })
          setCollabToken(tok.token)
        } catch {
          setCollabToken(null)
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message, [{ text: 'OK', onPress: () => router.back() }])
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    load()
  }, [load])

  useDocumentCollab({
    documentId: id,
    token: collabToken,
    enabled: !!collabToken && (doc?.type === 'TEXT' || doc?.type === 'CODE'),
  })

  const persist = useCallback(
    async (nextContent: string, nextTitle?: string) => {
      if (!token || !id || !doc?.canEdit) return
      setSaving(true)
      try {
        await apiFetch(`/api/documents/${id}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({
            content: nextContent,
            ...(nextTitle !== undefined ? { title: nextTitle } : {}),
          }),
        })
      } catch (e: any) {
        Alert.alert('Save failed', e.message)
      } finally {
        setSaving(false)
      }
    },
    [token, id, doc?.canEdit]
  )

  const onChangeContent = (value: string) => {
    setContent(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(value), 800)
  }

  const setAccess = async (publicAccess: string) => {
    if (!token || !id) return
    try {
      await apiFetch(`/api/documents/${id}/share`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ publicAccess }),
      })
      setDoc((d) => (d ? { ...d, publicAccess } : d))
      setShareOpen(false)
    } catch (e: any) {
      Alert.alert('Share failed', e.message)
    }
  }

  if (loading || !doc) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Back</Text>
          </Pressable>
          <Input
            value={title}
            editable={doc.isOwner}
            onChangeText={setTitle}
            onEndEditing={() => persist(content, title)}
            style={{ flex: 1, marginHorizontal: 10, paddingVertical: 8 }}
          />
          <Text style={{ color: colors.muted, fontSize: 11 }}>{saving ? 'Saving…' : 'Saved'}</Text>
          {doc.isOwner && (
            <Pressable onPress={() => setShareOpen(true)} style={{ marginLeft: 10 }}>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>Share</Text>
            </Pressable>
          )}
        </View>

        {renderEditor(doc.type, {
          content,
          onChange: onChangeContent,
          readOnly: !doc.canEdit,
          token,
        })}

        <Modal visible={shareOpen} transparent animationType="fade">
          <Pressable style={styles.backdrop} onPress={() => setShareOpen(false)}>
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 18, marginBottom: 12 }}>
                Sharing · {doc.publicAccess}
              </Text>
              {[
                { id: 'PRIVATE', label: 'Private', desc: 'Only you' },
                { id: 'READ', label: 'View Only', desc: 'Anyone with link can view' },
                { id: 'WRITE', label: 'Can Edit', desc: 'Anyone with link can edit' },
              ].map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => setAccess(opt.id)}
                  style={[
                    styles.opt,
                    {
                      borderColor: doc.publicAccess === opt.id ? colors.accent : colors.border,
                      backgroundColor: doc.publicAccess === opt.id ? colors.accentSoft : colors.surface2,
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontWeight: '700' }}>{opt.label}</Text>
                  <Text style={{ color: colors.muted, marginTop: 4 }}>{opt.desc}</Text>
                </Pressable>
              ))}
              <Button label="Close" variant="ghost" onPress={() => setShareOpen(false)} />
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 4,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  opt: { borderWidth: 1, borderRadius: 12, padding: 12 },
})
