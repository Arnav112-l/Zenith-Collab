import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native'
import { useTheme } from '../../theme/ThemeContext'

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme()
  return <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>{children}</View>
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme()
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function Title({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme()
  return <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: '700' }}>{children}</Text>
}

export function Muted({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme()
  return <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>{children}</Text>
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  loading?: boolean
  disabled?: boolean
}) {
  const { colors } = useTheme()
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.surface2
          : 'transparent'
  const color = variant === 'ghost' || variant === 'secondary' ? colors.foreground : '#fff'
  const borderColor = variant === 'ghost' || variant === 'secondary' ? colors.border : 'transparent'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          opacity: pressed || disabled ? 0.7 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={color} /> : <Text style={{ color, fontWeight: '600' }}>{label}</Text>}
    </Pressable>
  )
}

export function Input(props: React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme()
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface2,
          color: colors.foreground,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
        },
        props.style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
})
