<script setup>
import { computed } from 'vue'

const props = defineProps({
  board: Array,
})

const emit = defineEmits(['number'])

const buttons = computed(() => {
  const result = []
  for (let n = 1; n <= 9; n++) {
    let cnt = 0
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (props.board[r]?.[c] === n) cnt++
    result.push({ n, completed: cnt >= 9 })
  }
  return result
})
</script>

<template>
  <div
    class="grid grid-cols-9 gap-1.5 mb-2.5 max-w-[calc(var(--cell-size)*9)] w-full
           animate-fade-up"
    style="animation-delay: 0.16s"
  >
    <button
      v-for="btn in buttons"
      :key="btn.n"
      class="aspect-square max-h-12 bg-numpad-bg border border-border text-text
             font-mono text-base font-semibold rounded-btn cursor-pointer
             transition-all duration-150
             hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)"
      :class="{ 'opacity-18 pointer-events-none': btn.completed }"
      @click="emit('number', btn.n)"
    >
      {{ btn.n }}
    </button>
  </div>
</template>
