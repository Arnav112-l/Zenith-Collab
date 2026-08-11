import React from 'react'
import { StyleSheet, View } from 'react-native'
import { MotiView } from 'moti'
import { useTheme } from '../theme/ThemeContext'

/** Default/web orb. Native overrides via LandingOrb.native.tsx. */
export function LandingOrb() {
  const { colors } = useTheme()

  return (
    <View style={styles.wrap}>
      <MotiView
        from={{ scale: 0.75, opacity: 0.45 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'timing', duration: 1400, loop: true } as any}
        style={[styles.orb, { backgroundColor: colors.accent }]}
      />
      <MotiView
        from={{ scale: 1.1, opacity: 0.2 }}
        animate={{ scale: 1.45, opacity: 0 }}
        transition={{ type: 'timing', duration: 1400, loop: true } as any}
        style={[styles.ring, { borderColor: colors.accent }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  ring: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 60,
    borderWidth: 2,
  },
})
