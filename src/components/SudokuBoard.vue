<script setup>
import { computed } from 'vue'
import SudokuCell from './SudokuCell.vue'

const props = defineProps({
  state: Object,
  peerCursors: Object,
  won: Boolean,
})

const emit = defineEmits(['select'])

const size = computed(() => props.state.size || 9)
const box = computed(() => props.state.box || 3)

const cells = computed(() => {
  const result = []
  if (!props.state.puzzle?.length) return result
  const sel = props.state.selected
  const sv = sel ? props.state.board[sel[0]][sel[1]] : 0
  const b = box.value

  for (let r = 0; r < size.value; r++) {
    for (let c = 0; c < size.value; c++) {
      const isGiven = props.state.puzzle[r][c] !== 0
      const value = props.state.board[r][c]
      const isSelected = sel && r === sel[0] && c === sel[1]
      const isHighlighted =
        sel &&
        !isSelected &&
        (r === sel[0] ||
          c === sel[1] ||
          (Math.floor(r / b) === Math.floor(sel[0] / b) &&
            Math.floor(c / b) === Math.floor(sel[1] / b)))
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
        ownerColor: props.state.cellOwners?.[r]?.[c] || null,
      })
    }
  }
  return result
})
</script>

<template>
  <div
    class="board-grid border-2 border-border-thick rounded-md overflow-hidden
           shadow-(--shadow) transition-[border-color,box-shadow] duration-250"
    :class="[`board-grid--${size === 16 ? 'hexadoku' : 'sudoku'}`]"
    :style="{
      display: 'grid',
      gridTemplateColumns: `repeat(${size}, var(--cell-size))`,
      gridTemplateRows: `repeat(${size}, var(--cell-size))`,
    }"
  >
    <SudokuCell
      v-for="cell in cells"
      :key="`${cell.r}-${cell.c}`"
      :row="cell.r"
      :col="cell.c"
      :value="cell.value"
      :size="size"
      :box="box"
      :is-given="cell.isGiven"
      :is-selected="cell.isSelected"
      :is-highlighted="cell.isHighlighted"
      :is-error="cell.isError"
      :is-same-number="cell.isSameNumber"
      :notes="cell.notes"
      :peer-cursors="cell.peerCursors"
      :owner-color="cell.ownerColor"
      :won="won"
      @select="(r, c) => emit('select', r, c)"
    />
  </div>
</template>

<style scoped>
/* Sudoku (9x9, 3x3 boxes): thick right border on every 3rd column, thick bottom on every 3rd row */
.board-grid--sudoku :deep(.cell:nth-child(3n)) { border-right: 2px solid var(--border-thick); }
.board-grid--sudoku :deep(.cell:nth-child(9n)) { border-right: none; }
.board-grid--sudoku :deep(.cell:nth-child(n+19):nth-child(-n+27)) { border-bottom: 2px solid var(--border-thick); }
.board-grid--sudoku :deep(.cell:nth-child(n+46):nth-child(-n+54)) { border-bottom: 2px solid var(--border-thick); }

/* Hexadoku (16x16, 4x4 boxes): thick border on every 4th column and 4th row */
.board-grid--hexadoku :deep(.cell:nth-child(4n)) { border-right: 2px solid var(--border-thick); }
.board-grid--hexadoku :deep(.cell:nth-child(16n)) { border-right: none; }
.board-grid--hexadoku :deep(.cell:nth-child(n+49):nth-child(-n+64)) { border-bottom: 2px solid var(--border-thick); }
.board-grid--hexadoku :deep(.cell:nth-child(n+113):nth-child(-n+128)) { border-bottom: 2px solid var(--border-thick); }
.board-grid--hexadoku :deep(.cell:nth-child(n+177):nth-child(-n+192)) { border-bottom: 2px solid var(--border-thick); }
</style>
