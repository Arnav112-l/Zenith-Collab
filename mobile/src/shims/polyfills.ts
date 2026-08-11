import { getRandomValues as expoGetRandomValues } from 'expo-crypto'

const g = globalThis as any

if (typeof g.window === 'undefined') {
  g.window = g
}

if (!g.crypto || typeof g.crypto.getRandomValues !== 'function') {
  g.crypto = {
    getRandomValues: (array: ArrayBufferView) => expoGetRandomValues(array as any),
  }
}
