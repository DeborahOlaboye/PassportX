'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemePreferences {
  mode: ThemeMode
  accentColor?: string
}

interface ThemeContextType {
  theme: ThemeMode
  effectiveTheme: 'light' | 'dark'
  accentColor: string
  setTheme: (mode: ThemeMode) => void
  setAccentColor: (color: string) => void
  updateThemePreferences: (preferences: ThemePreferences) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const DEFAULT_ACCENT_COLOR = '#3B82F6'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system')
  const [accentColor, setAccentColorState] = useState(DEFAULT_ACCENT_COLOR)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

  // Initialize theme from localStorage or user preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode
    const savedAccentColor = localStorage.getItem('accentColor')

    if (savedTheme) {
      setThemeState(savedTheme)
    }
    if (savedAccentColor) {
      setAccentColorState(savedAccentColor)
    }
  }, [])

  // Update effective theme based on theme mode
  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setEffectiveTheme(isDark ? 'dark' : 'light')
      } else {
        setEffectiveTheme(theme)
      }
    }

    updateEffectiveTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        updateEffectiveTheme()
      }
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)

    // Apply accent color as CSS variable
    root.style.setProperty('--color-accent', accentColor)
  }, [effectiveTheme, accentColor])

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode)
    localStorage.setItem('theme', mode)
  }

  const setAccentColor = (color: string) => {
    setAccentColorState(color)
    localStorage.setItem('accentColor', color)
  }

  const updateThemePreferences = (preferences: ThemePreferences) => {
    setTheme(preferences.mode)
    if (preferences.accentColor) {
      setAccentColor(preferences.accentColor)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        accentColor,
        setTheme,
        setAccentColor,
        updateThemePreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
