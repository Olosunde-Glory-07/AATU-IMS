import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  // Live-follow the OS theme, but ONLY if the person hasn't made an explicit
  // choice yet (no saved preference in localStorage).
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(e) {
      const saved = localStorage.getItem('theme')
      if (saved !== 'dark' && saved !== 'light') {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  const value = { theme, toggleTheme, setTheme, isDark: theme === 'dark' }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}