import { useTheme } from 'next-themes'
import { MoonStarIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppearanceSettings } from './appearance-settings'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const modes = ['light', 'dark', 'system'] as const
    const currentIndex = modes.indexOf(theme as (typeof modes)[number])
    const next = modes[(currentIndex + 1) % modes.length]
    setTheme(next)
  }

  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={cycleTheme} aria-label="Toggle theme">
        <SunIcon className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonStarIcon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      <AppearanceSettings />
    </>
  )
}
