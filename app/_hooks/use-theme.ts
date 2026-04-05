'use client'

import { useEffect, useMemo, useState } from 'react'

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

export default function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setTheme(saved)
      }
    } catch {
      // ignore storage errors and keep system theme
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    applyTheme(theme)

    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    media.addEventListener('change', handler)

    return () => {
      media.removeEventListener('change', handler)
    }
  }, [theme, mounted])

  const resolvedTheme = useMemo(
    () => (theme === 'system' ? (mounted ? getSystemTheme() : 'light') : theme),
    [theme, mounted]
  )

  function updateTheme(nextTheme: Theme) {
    setTheme(nextTheme)
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
    mounted,
    setTheme: updateTheme,
    toggleTheme,
  }
}
