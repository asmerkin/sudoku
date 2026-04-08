<script setup>
import { computed } from 'vue'
import { formatValue } from '../composables/useSudokuEngine.js'

const props = defineProps({
  board: Array,
  size: { type: Number, default: 9 },
})

const emit = defineEmits(['number'])

const buttons = computed(() => {
  const result = []
  for (let n = 1; n <= props.size; n++) {
    let cnt = 0
    for (let r = 0; r < props.size; r++)
      for (let c = 0; c < props.size; c++) if (props.board[r]?.[c] === n) cnt++
    result.push({ n, label: formatValue(n), completed: cnt >= props.size })
  }
  return result
})

// Grid layout: 9 columns for sudoku, 8 columns (2 rows of 8) for hexadoku
const gridCols = computed(() => (props.size === 16 ? 8 : 9))
</script>

<template>
  <div
    class="numpad-grid gap-1.5 mb-2.5 w-full animate-fade-up"
    :class="size === 16 ? 'numpad-grid--hex' : 'numpad-grid--std'"
    :style="{
      display: 'grid',
      gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
      maxWidth: `calc(var(--cell-size) * ${size})`,
    }"
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
      {{ btn.label }}
    </button>
  </div>
</template>
