import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useEffect, type ReactNode } from 'react'
import { applyThemePreset, getStoredThemePreset } from '@/lib/theme-presets'

function ThemePresetInitializer() {
  useEffect(() => {
    applyThemePreset(getStoredThemePreset())
  }, [])
  return null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <ThemePresetInitializer />
      {children}
    </NextThemesProvider>
  )
}
