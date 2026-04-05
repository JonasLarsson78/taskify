'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'taskify-theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.style.colorScheme = resolved
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'

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

export default function useTheme() {
  const [themeOverride, setThemeOverride] = useState<Theme>('system')
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const storedTheme = useMemo(
    () => (isClient ? readStoredTheme() : 'system'),
    [isClient]
  )

  const theme = themeOverride === 'system' ? storedTheme : themeOverride

  useEffect(() => {
    if (!isClient) return

    applyTheme(theme)

    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    media.addEventListener('change', handler)

    return () => {
      media.removeEventListener('change', handler)
    }
  }, [theme, isClient])

  const resolvedTheme = useMemo(
    () =>
      theme === 'system' ? (isClient ? getSystemTheme() : 'light') : theme,
    [theme, isClient]
  )

  function updateTheme(nextTheme: Theme) {
    setThemeOverride(nextTheme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {}
  }

  function toggleTheme() {
    updateTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return {
    theme,
    resolvedTheme,
    setTheme: updateTheme,
    toggleTheme,
  }
}
