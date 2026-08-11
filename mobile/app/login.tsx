import React, { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MotiView } from 'moti'
import { Screen, Button, Card, Muted, Title } from '../src/components/ui'
import { useTheme } from '../src/theme/ThemeContext'
import { useAuth } from '../src/auth/AuthContext'

export default function LoginScreen() {
  const { colors } = useTheme()
  const { user, loading, signInWithGitHub } = useAuth()
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Redirect href="/(app)/dashboard" />
  }

  const onLogin = async () => {
    try {
      setBusy(true)
      await signInWithGitHub()
      router.replace('/(app)/dashboard')
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message || 'Unable to sign in with GitHub')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ gap: 16 }}
        >
          <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
            <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 22 }}>Z</Text>
          </View>
          <Title>Welcome to Zenith</Title>
          <Muted>Sign in to access your collaborative workspace on mobile.</Muted>
          <Card>
            <Button label="Continue with GitHub" onPress={onLogin} loading={busy} />
            <Text style={[styles.legal, { color: colors.muted }]}>
              By signing in you agree to the Terms of Service and Privacy Policy.
            </Text>
          </Card>
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
        </MotiView>
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center', padding: 20 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legal: { marginTop: 14, fontSize: 12, textAlign: 'center', lineHeight: 18 },
})
