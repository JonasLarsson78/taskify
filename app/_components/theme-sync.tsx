'use client'

import { useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'taskify-theme'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function readStoredTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
  } catch {
    // ignore storage errors and fallback to system
  }

  return 'system'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.style.colorScheme = resolved
  // Sync theme to cookie for SSR
  try {
    document.cookie = `taskify-theme=${theme}; path=/; max-age=31536000`
  } catch {}
}

export default function ThemeSync() {
  useEffect(() => {
    const theme = readStoredTheme()
    applyTheme(theme)

    // Listen for theme changes in localStorage (multi-tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const newTheme = readStoredTheme()
        applyTheme(newTheme)
      }
    }
    window.addEventListener('storage', onStorage)

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      media.addEventListener('change', handler)
      return () => {
        media.removeEventListener('change', handler)
        window.removeEventListener('storage', onStorage)
      }
    }
    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return null
}
