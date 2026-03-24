import { ref } from 'vue'

const theme = ref('dark')

try {
  const saved = localStorage.getItem('sudoku-theme')
  if (saved) theme.value = saved
} catch (e) { /* ignore */ }

// Apply on load
document.documentElement.setAttribute('data-theme', theme.value)

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', theme.value)
    try {
      localStorage.setItem('sudoku-theme', theme.value)
    } catch (e) { /* ignore */ }
  }

  return { theme, toggleTheme }
}
