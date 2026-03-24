<script setup>
import { computed } from 'vue'
import SudokuCell from './SudokuCell.vue'

const props = defineProps({
  state: Object,
  peerCursors: Object,
})

const emit = defineEmits(['select'])

const cells = computed(() => {
  const result = []
  const sel = props.state.selected
  const sv = sel ? props.state.board[sel[0]][sel[1]] : 0

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const isGiven = props.state.puzzle[r][c] !== 0
      const value = props.state.board[r][c]
      const isSelected = sel && r === sel[0] && c === sel[1]
      const isHighlighted =
        sel &&
        !isSelected &&
        (r === sel[0] ||
          c === sel[1] ||
          (Math.floor(r / 3) === Math.floor(sel[0] / 3) &&
            Math.floor(c / 3) === Math.floor(sel[1] / 3)))
      const isError = !isGiven && value !== 0 && value !== props.state.solution[r][c]
      const isSameNumber = sel && sv !== 0 && value === sv && !isSelected

      const cursors = []
      if (props.peerCursors) {
        for (const [pid, pdata] of Object.entries(props.peerCursors)) {
          if (pdata.r === r && pdata.c === c) {
            cursors.push({ peerId: pid, color: pdata.color })
          }
        }
      }

      result.push({
        r, c, value, isGiven, isSelected, isHighlighted, isError, isSameNumber,
        notes: props.state.notes[r][c],
        peerCursors: cursors,
      })
    }
  }
  return result
})
</script>

<template>
  <div
    class="board-grid grid grid-cols-9 grid-rows-9 border-2 border-border-thick
           rounded-md overflow-hidden shadow-(--shadow) transition-[border-color,box-shadow] duration-250"
  >
    <SudokuCell
      v-for="cell in cells"
      :key="`${cell.r}-${cell.c}`"
      :row="cell.r"
      :col="cell.c"
      :value="cell.value"
      :is-given="cell.isGiven"
      :is-selected="cell.isSelected"
      :is-highlighted="cell.isHighlighted"
      :is-error="cell.isError"
      :is-same-number="cell.isSameNumber"
      :notes="cell.notes"
      :peer-cursors="cell.peerCursors"
      @select="(r, c) => emit('select', r, c)"
    />
  </div>
</template>

<style scoped>
.board-grid :deep(.cell:nth-child(3n)) { border-right: 2px solid var(--border-thick); }
.board-grid :deep(.cell:nth-child(9n)) { border-right: none; }
.board-grid :deep(.cell:nth-child(n+19):nth-child(-n+27)) { border-bottom: 2px solid var(--border-thick); }
.board-grid :deep(.cell:nth-child(n+46):nth-child(-n+54)) { border-bottom: 2px solid var(--border-thick); }
</style>
