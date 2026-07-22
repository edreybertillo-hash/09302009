import { useEffect } from 'react'

export function useTheme() {

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const theme = stored || 'light'
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    document.documentElement.style.colorScheme = theme
  }, [])
}

export function toggleTheme() {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  const next = current === 'dark' ? 'light' : 'dark'
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(next)
  document.documentElement.style.colorScheme = next
  localStorage.setItem('theme', next)
}
