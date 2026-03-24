import { ref } from 'vue'

const message = ref('')
const visible = ref(false)
let timeout = null

export function useToast() {
  function show(msg, ms = 2000) {
    message.value = msg
    visible.value = true
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      visible.value = false
    }, ms)
  }

  return { message, visible, show }
}
