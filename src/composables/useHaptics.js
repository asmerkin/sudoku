import { computed } from 'vue'

const isIOS = computed(() => {
  if (typeof window === 'undefined') return false
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isMacWithTouch = navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1
  return isIOSDevice || isMacWithTouch
})

const isSupported = computed(() => {
  if (typeof window === 'undefined') return false
  if (isIOS.value) return true
  return 'vibrate' in navigator && typeof navigator.vibrate === 'function'
})

function triggerIOSHaptic() {
  try {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.setAttribute('switch', '')
    checkbox.style.cssText = 'position:fixed;opacity:0;pointer-events:none;left:-9999px'

    const label = document.createElement('label')
    const id = `haptic-${Date.now()}-${Math.random()}`
    checkbox.id = id
    label.htmlFor = id
    label.style.cssText = 'position:fixed;opacity:0;pointer-events:none;left:-9999px'

    document.body.appendChild(checkbox)
    document.body.appendChild(label)
    label.click()

    setTimeout(() => {
      document.body.removeChild(checkbox)
      document.body.removeChild(label)
    }, 100)
  } catch {}
}

function triggerHaptic(pattern) {
  if (!isSupported.value) return false
  try {
    if (isIOS.value) { triggerIOSHaptic(); return true }
    if ('vibrate' in navigator) return navigator.vibrate(pattern)
  } catch {}
  return false
}

export function useHaptics() {
  return {
    isSupported,
    light: () => triggerHaptic(10),
    medium: () => triggerHaptic(20),
    heavy: () => triggerHaptic(40),
    success: () => triggerHaptic([10, 50, 10]),
    error: () => triggerHaptic([20, 100, 20, 100, 20]),
    selection: () => triggerHaptic(5),
  }
}
