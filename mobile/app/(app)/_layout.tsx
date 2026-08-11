import { Redirect, Stack } from 'expo-router'
import { useAuth } from '../../src/auth/AuthContext'
import { ActivityIndicator, View } from 'react-native'
import { useTheme } from '../../src/theme/ThemeContext'

export default function AppLayout() {
  const { user, loading } = useAuth()
  const { colors } = useTheme()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/login" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  )
}
