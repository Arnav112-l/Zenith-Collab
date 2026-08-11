import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'zenith.mobile.token'
const USER_KEY = 'zenith.mobile.user'

export type MobileUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3000'
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://127.0.0.1:4000'
const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || ''

export const config = {
  apiUrl: API_URL.replace(/\/$/, ''),
  wsUrl: WS_URL.replace(/\/$/, ''),
  githubClientId: GITHUB_CLIENT_ID,
}

/** SecureStore is native-only; web uses AsyncStorage. */
const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key)
    return SecureStore.getItemAsync(key)
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value)
    return SecureStore.setItemAsync(key, value)
  },
  async deleteItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key)
    return SecureStore.deleteItemAsync(key)
  },
}

export async function saveSession(token: string, user: MobileUser) {
  await storage.setItem(TOKEN_KEY, token)
  await storage.setItem(USER_KEY, JSON.stringify(user))
}

export async function clearSession() {
  await storage.deleteItem(TOKEN_KEY)
  await storage.deleteItem(USER_KEY)
}

export async function loadSession(): Promise<{ token: string; user: MobileUser } | null> {
  const token = await storage.getItem(TOKEN_KEY)
  const userRaw = await storage.getItem(USER_KEY)
  if (!token || !userRaw) return null
  try {
    return { token, user: JSON.parse(userRaw) as MobileUser }
  } catch {
    return null
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options
  const res = await fetch(`${config.apiUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  })

  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const message = data?.error || data || `Request failed (${res.status})`
    throw new Error(typeof message === 'string' ? message : 'Request failed')
  }

  return data as T
}
