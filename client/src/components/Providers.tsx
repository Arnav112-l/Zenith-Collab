'use client'

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import ErrorBoundary from "./ErrorBoundary"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}
