<script setup>
import { computed } from 'vue'
import { formatValue } from '../composables/useSudokuEngine.js'

const props = defineProps({
  row: Number,
  col: Number,
  value: Number,
  size: { type: Number, default: 9 },
  box: { type: Number, default: 3 },
  isGiven: Boolean,
  isSelected: Boolean,
  isHighlighted: Boolean,
  isError: Boolean,
  isSameNumber: Boolean,
  notes: Set,
  peerCursors: Array,
  ownerColor: String,
  won: Boolean,
})

const emit = defineEmits(['select'])

const displayValue = computed(() => formatValue(props.value))
const noteCount = computed(() => props.size) // 9 for sudoku, 16 for hexadoku
const noteGridCols = computed(() => props.box) // 3 for sudoku, 4 for hexadoku
</script>

<template>
  <div
    class="cell flex items-center justify-center font-mono font-medium
           cursor-pointer border-[0.5px] border-border transition-[background] duration-100
           relative"
    :class="{
      'text-given font-bold': isGiven,
      'text-input font-semibold': !isGiven && value !== 0 && !ownerColor,
      'font-semibold': !isGiven && value !== 0 && ownerColor,
      'bg-accent-dim shadow-[inset_0_0_0_2px_var(--accent)] z-1': isSelected,
      'bg-highlight': isHighlighted && !isSelected,
      'bg-error-dim text-error!': isError,
      'bg-accent-glow': isSameNumber && !isSelected,
      'win-cell-flash': won,
      'text-xl': size === 9,
      'text-sm': size === 16,
    }"
    :style="[
      ownerColor && !isGiven && !isError ? { color: ownerColor } : {},
      won ? { animationDelay: (row * size + col) * 20 + 'ms' } : {},
    ]"
    @click="emit('select', row, col)"
  >
    <template v-if="isGiven || value !== 0">{{ displayValue }}</template>
    <div
      v-else-if="notes && notes.size > 0"
      class="grid w-full h-full p-px text-text-muted leading-none font-medium font-mono"
      :class="size === 16 ? 'text-[0.38rem]' : 'text-[0.6rem]'"
      :style="{
        gridTemplateColumns: `repeat(${noteGridCols}, 1fr)`,
        gridTemplateRows: `repeat(${noteGridCols}, 1fr)`,
      }"
    >
      <span
        v-for="n in noteCount"
        :key="n"
        class="flex items-center justify-center"
      >
        {{ notes.has(n) ? (n < 10 ? n : String.fromCharCode(55 + n)) : '' }}
      </span>
    </div>
    <div
      v-for="cursor in peerCursors"
      :key="cursor.peerId"
      class="absolute inset-px rounded-sm pointer-events-none border-2 opacity-60"
      :style="{ borderColor: cursor.color }"
      style="animation: peerPulse 2s ease infinite"
    />
  </div>
</template>

<style scoped>
.cell {
  width: var(--cell-size);
  height: var(--cell-size);
}
</style>
