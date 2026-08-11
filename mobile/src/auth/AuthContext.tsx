import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import {
  apiFetch,
  clearSession,
  config,
  loadSession,
  MobileUser,
  saveSession,
} from '../api/client'

WebBrowser.maybeCompleteAuthSession()

type AuthContextValue = {
  user: MobileUser | null
  token: string | null
  loading: boolean
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
      .then((session) => {
        if (session) {
          setToken(session.token)
          setUser(session.user)
        }
      })
      .catch((err) => {
        console.warn('Failed to restore session', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const refreshMe = useCallback(async () => {
    if (!token) return
    const data = await apiFetch<{ user: MobileUser }>('/api/auth/mobile/me', { token })
    setUser(data.user)
    await saveSession(token, data.user)
  }, [token])

  const signInWithGitHub = useCallback(async () => {
    if (!config.githubClientId) {
      throw new Error('EXPO_PUBLIC_GITHUB_CLIENT_ID is missing')
    }

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'zenith',
      path: 'oauth',
    })

    const discovery = {
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
    }

    const request = new AuthSession.AuthRequest({
      clientId: config.githubClientId,
      scopes: ['read:user', 'user:email'],
      redirectUri,
      usePKCE: false,
    })

    await request.makeAuthUrlAsync(discovery)
    const result = await request.promptAsync(discovery)

    if (result.type !== 'success' || !result.params.code) {
      throw new Error('GitHub sign-in was cancelled')
    }

    const data = await apiFetch<{ token: string; user: MobileUser }>(
      '/api/auth/mobile/github',
      {
        method: 'POST',
        body: JSON.stringify({
          code: result.params.code,
          redirectUri,
        }),
      }
    )

    await saveSession(data.token, data.user)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const signOut = useCallback(async () => {
    await clearSession()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, signInWithGitHub, signOut, refreshMe }),
    [user, token, loading, signInWithGitHub, signOut, refreshMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
