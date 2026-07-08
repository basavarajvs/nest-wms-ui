const THEME_PRESET_OPTIONS = [
  {
    label: 'Default',
    value: 'default',
    primary: {
      light: 'oklch(0.205 0 0)',
      dark: 'oklch(0.922 0 0)',
    },
  },
  {
    label: 'Brutalist',
    value: 'brutalist',
    primary: {
      light: 'oklch(0.6489 0.237 26.9728)',
      dark: 'oklch(0.7044 0.1872 23.1858)',
    },
  },
  {
    label: 'Soft Pop',
    value: 'soft-pop',
    primary: {
      light: 'oklch(0.5106 0.2301 276.9656)',
      dark: 'oklch(0.6801 0.1583 276.9349)',
    },
  },
  {
    label: 'Tangerine',
    value: 'tangerine',
    primary: {
      light: 'oklch(0.64 0.17 36.44)',
      dark: 'oklch(0.64 0.17 36.44)',
    },
  },
] as const

export const THEME_PRESETS = THEME_PRESET_OPTIONS
export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number]['value']

const STORAGE_KEY = 'theme_preset'
const DEFAULT_PRESET: ThemePreset = 'default'

export function getStoredThemePreset(): ThemePreset {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && THEME_PRESET_OPTIONS.some((p) => p.value === stored)) {
      return stored as ThemePreset
    }
  } catch {}
  return DEFAULT_PRESET
}

export function applyThemePreset(preset: ThemePreset) {
  const root = document.documentElement
  root.setAttribute('data-theme-preset', preset)
  root.classList.add('disable-transitions')
  try {
    localStorage.setItem(STORAGE_KEY, preset)
  } catch {}
  requestAnimationFrame(() => {
    root.classList.remove('disable-transitions')
  })
}