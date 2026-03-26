import { ref } from 'vue'
import { messages } from '../i18n/messages.js'

function detectLocale() {
  try {
    const saved = localStorage.getItem('sudoku-lang')
    if (saved && messages[saved]) return saved
  } catch {}
  const nav = navigator.language?.slice(0, 2)
  return nav === 'en' ? 'en' : 'es'
}

const locale = ref(detectLocale())

document.documentElement.lang = locale.value

export function useI18n() {
  function t(key, ...args) {
    const val = messages[locale.value]?.[key] ?? messages.es[key] ?? key
    return typeof val === 'function' ? val(...args) : val
  }

  function setLocale(l) {
    locale.value = l
    document.documentElement.lang = l
    try { localStorage.setItem('sudoku-lang', l) } catch {}
  }

  function toggleLocale() {
    setLocale(locale.value === 'es' ? 'en' : 'es')
  }

  return { locale, t, setLocale, toggleLocale }
}
