import { ref, onUnmounted } from 'vue'

export function useTimer() {
  const display = ref('00:00')
  let startTime = null
  let interval = null

  function update() {
    if (!startTime) return
    const e = Math.floor((Date.now() - startTime) / 1000)
    display.value = `${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`
  }

  function start() {
    stop()
    startTime = Date.now()
    display.value = '00:00'
    interval = setInterval(update, 1000)
  }

  function stop() {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  onUnmounted(stop)

  return { display, start, stop }
}
