import React, { useEffect, useState } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView, MotiText } from 'moti'
import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'
import { Button, Muted } from '../src/components/ui'
import { LandingOrb } from '../src/components/LandingOrb'
import { useTheme } from '../src/theme/ThemeContext'
import { useAuth } from '../src/auth/AuthContext'
import { config } from '../src/api/client'

const WORDS = ['collaborative editor', 'note-taking app', 'document workspace']
const { width } = Dimensions.get('window')

function Typewriter() {
  const { colors } = useTheme()
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const full = WORDS[index]
    const timeout = setTimeout(() => {
      if (!deleting && text.length < full.length) {
        setText(full.slice(0, text.length + 1))
      } else if (!deleting && text.length === full.length) {
        setTimeout(() => setDeleting(true), 1200)
      } else if (deleting && text.length > 0) {
        setText(full.slice(0, text.length - 1))
      } else {
        setDeleting(false)
        setIndex((i) => (i + 1) % WORDS.length)
      }
    }, deleting ? 36 : 62)
    return () => clearTimeout(timeout)
  }, [text, deleting, index])

  return (
    <Text style={[styles.typewriter, { color: colors.accent }]}>
      {text}
      <Text style={{ opacity: 0.45 }}>|</Text>
    </Text>
  )
}

export default function LandingScreen() {
  const { colors, isDark } = useTheme()
  const { user, loading } = useAuth()
  const [apiOk, setApiOk] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true
    const ping = async () => {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 3500)
        const res = await fetch(`${config.apiUrl}/api/auth/mobile/me`, {
          signal: ctrl.signal,
          headers: { Accept: 'application/json' },
        })
        clearTimeout(t)
        // 401 means API is reachable but unauthenticated — that's fine
        if (alive) setApiOk(res.status === 401 || res.ok || res.status < 500)
      } catch {
        if (alive) setApiOk(false)
      }
    }
    ping()
    return () => {
      alive = false
    }
  }, [])

  if (!loading && user) {
    return <Redirect href="/(app)/dashboard" />
  }

  const gradient = isDark
    ? ['#09090b', '#1a0b16', '#0c1220', '#09090b']
    : ['#fff7fb', '#fdf2f8', '#eff6ff', '#fafafa']

  const goLogin = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      } catch {
        /* ignore */
      }
    }
    router.push('/login')
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <MotiView
        from={{ opacity: 0.15, scale: 0.8 }}
        animate={{ opacity: 0.35, scale: 1.15 }}
        transition={{ type: 'timing', duration: 4200, loop: true } as any}
        style={[styles.glow, { backgroundColor: colors.accent, left: width * 0.45 }]}
      />
      <SafeAreaView style={styles.safe}>
        <MotiView
          from={{ opacity: 0, translateY: -14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 520 }}
          style={styles.nav}
        >
          <View style={[styles.logo, { backgroundColor: colors.accent }]}>
            <Text style={styles.logoText}>Z</Text>
          </View>
          <Text style={[styles.brand, { color: colors.foreground }]}>Zenith</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={goLogin} hitSlop={12}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Sign in</Text>
          </Pressable>
        </MotiView>

        {apiOk === false && (
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={[styles.banner, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
          >
            <Text style={{ color: colors.foreground, fontWeight: '700', marginBottom: 4 }}>
              Can’t reach Zenith server
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
              Keep your phone on the same Wi‑Fi as your PC. API: {config.apiUrl}
            </Text>
          </MotiView>
        )}

        <View style={styles.hero}>
          <LandingOrb />
          <MotiText
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 90 }}
            style={[styles.kicker, { color: colors.muted }]}
          >
            Built for real teams
          </MotiText>
          <MotiText
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 160 }}
            style={[styles.headline, { color: colors.foreground }]}
          >
            Zenith
          </MotiText>
          <MotiText
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 210 }}
            style={[styles.subhead, { color: colors.foreground }]}
          >
            A <Text style={{ color: colors.accent, fontStyle: 'italic' }}>fast</Text> collaborative
          </MotiText>
          <Typewriter />
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 320 }}>
            <Muted>
              Notes, code, whiteboards, kanban, calendar, budgets — live-synced across your team.
            </Muted>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 420 }}
            style={styles.cta}
          >
            <Button label="Get Started" onPress={goLogin} />
            <Text style={[styles.hint, { color: colors.muted }]}>
              Android 12+ · iOS 16.4+ · Expo Go
            </Text>
          </MotiView>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 22 },
  glow: {
    position: 'absolute',
    top: '18%',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.25,
  },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  logo: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  brand: { fontWeight: '800', fontSize: 22, letterSpacing: -0.3 },
  banner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  hero: { flex: 1, justifyContent: 'center', gap: 10, paddingBottom: 36 },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginTop: 4,
  },
  headline: { fontSize: 52, fontWeight: '900', letterSpacing: -1.4, lineHeight: 56 },
  subhead: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  typewriter: { fontSize: 26, fontWeight: '700', minHeight: 36 },
  cta: { marginTop: 26, gap: 14 },
  hint: { textAlign: 'center', fontSize: 12, fontWeight: '500' },
})
