/**
 * Metro shim for lib0's React Native webcrypto path.
 * Avoids isomorphic-webcrypto (pulls deprecated @unimodules and crashes Expo Go).
 */
const { getRandomValues } = require('expo-crypto')

const crypto =
  globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function'
    ? globalThis.crypto
    : {
        getRandomValues,
        subtle: undefined,
      }

if (!globalThis.crypto) {
  globalThis.crypto = crypto
}

module.exports = crypto
module.exports.default = crypto
module.exports.subtle = crypto.subtle
module.exports.getRandomValues =
  typeof crypto.getRandomValues === 'function'
    ? crypto.getRandomValues.bind(crypto)
    : getRandomValues
