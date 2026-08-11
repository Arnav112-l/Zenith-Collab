import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Screen, Button, Card, Muted, Title } from '../../src/components/ui'
import { useTheme } from '../../src/theme/ThemeContext'
import { useAuth } from '../../src/auth/AuthContext'

const MODES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
] as const

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme()
  const { user, signOut } = useAuth()

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1, padding: 16, gap: 16 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>Back</Text>
        </Pressable>
        <Title>Settings</Title>

        <Card>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>ACCOUNT</Text>
          <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>{user?.name}</Text>
          <Muted>{user?.email}</Muted>
        </Card>

        <Card>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>APPEARANCE</Text>
          <View style={styles.row}>
            {MODES.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                style={[
                  styles.mode,
                  {
                    borderColor: mode === m.id ? colors.accent : colors.border,
                    backgroundColor: mode === m.id ? colors.accentSoft : colors.surface2,
                  },
                ]}
              >
                <Text style={{ color: mode === m.id ? colors.accent : colors.muted, fontWeight: '700' }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Button
          label="Sign out"
          variant="danger"
          onPress={async () => {
            await signOut()
            router.replace('/login')
          }}
        />
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  mode: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
})
