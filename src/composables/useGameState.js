import { reactive, computed } from 'vue'
import {
  generatePuzzle,
  hashSeed,
  DIFFICULTY,
  DIFF_KEYS,
  encodeSeed,
  decodeSeed,
  randomSeed,
} from './useSudokuEngine.js'

function createEmptyNotes() {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()))
}

function createEmptyOwners() {
  return Array.from({ length: 9 }, () => Array(9).fill(null))
}

const state = reactive({
  solution: [],
  puzzle: [],
  board: [],
  notes: createEmptyNotes(),
  cellOwners: createEmptyOwners(),
  selected: null,
  notesMode: false,
  difficulty: 'easy',
  difficultyIdx: 0,
  mistakes: 0,
  playerErrors: {},
  history: [],
  won: false,
  seed: '',
  seedDisplay: '',
})

export function useGameState() {
  function init(seedValue) {
    const { raw } = decodeSeed(seedValue || '')
    const cleanRaw = raw || randomSeed()
    const fullSeed = encodeSeed(cleanRaw, state.difficulty)
    state.seed = fullSeed
    state.seedDisplay = fullSeed

    const { puzzle, solution } = generatePuzzle(hashSeed(fullSeed), DIFFICULTY[state.difficulty])
    state.solution = solution
    state.puzzle = puzzle
    state.board = puzzle.map((r) => [...r])
    state.notes = createEmptyNotes()
    state.cellOwners = createEmptyOwners()
    state.selected = null
    state.mistakes = 0
    state.playerErrors = {}
    state.history = []
    state.won = false
  }

  function setDifficulty(idx) {
    idx = Math.max(0, Math.min(3, idx))
    state.difficulty = DIFF_KEYS[idx]
    state.difficultyIdx = idx
  }

  function updateSeedDisplay() {
    const { raw } = decodeSeed(state.seedDisplay)
    state.seedDisplay = encodeSeed(raw, state.difficulty)
  }

  function parseSeedInput(input) {
    const { raw, difficulty, idx } = decodeSeed(input.trim())
    if (difficulty) {
      state.difficulty = difficulty
      state.difficultyIdx = idx
    }
    return encodeSeed(raw || randomSeed(), state.difficulty)
  }

  function cleanNotesFor(r, c, n) {
    const cleaned = []
    const br = Math.floor(r / 3) * 3
    const bc = Math.floor(c / 3) * 3
    for (let i = 0; i < 9; i++) {
      if (i !== c && state.notes[r][i].has(n)) {
        cleaned.push({ r, c: i })
        state.notes[r][i].delete(n)
      }
      if (i !== r && state.notes[i][c].has(n)) {
        cleaned.push({ r: i, c })
        state.notes[i][c].delete(n)
      }
    }
    for (let dr = br; dr < br + 3; dr++) {
      for (let dc = bc; dc < bc + 3; dc++) {
        if ((dr !== r || dc !== c) && state.notes[dr][dc].has(n)) {
          if (!cleaned.some((x) => x.r === dr && x.c === dc)) cleaned.push({ r: dr, c: dc })
          state.notes[dr][dc].delete(n)
        }
      }
    }
    return cleaned
  }

  function placeNumber(n, fromPeer = false, color = null) {
    if (!state.selected || state.won) return
    const [r, c] = state.selected
    if (state.puzzle[r][c] !== 0) return
    if (state.board[r][c] !== 0 && state.board[r][c] === state.solution[r][c]) return

    if (state.notesMode && !fromPeer) {
      state.history.push({ type: 'note', r, c, prev: new Set(state.notes[r][c]) })
      if (state.notes[r][c].has(n)) state.notes[r][c].delete(n)
      else state.notes[r][c].add(n)
      return { type: 'note', r, c, n, toggle: state.notes[r][c].has(n) }
    } else {
      const prev = state.board[r][c]
      const prevNotes = new Set(state.notes[r][c])
      const prevOwner = state.cellOwners[r][c]
      state.board[r][c] = n
      state.notes[r][c].clear()
      state.cellOwners[r][c] = color
      const cleaned = cleanNotesFor(r, c, n)
      if (!fromPeer) {
        state.history.push({ type: 'place', r, c, prev, prevNotes, prevOwner, cleanedNotes: cleaned, cleanedNum: n })
        if (n !== state.solution[r][c]) {
          state.mistakes++
          if (color) state.playerErrors[color] = (state.playerErrors[color] || 0) + 1
        }
      }
      checkWin()
      return { type: 'place', r, c, n, color }
    }
  }

  function eraseCell(fromPeer = false) {
    if (!state.selected || state.won) return
    const [r, c] = state.selected
    if (state.puzzle[r][c] !== 0) return
    if (state.board[r][c] !== 0 && state.board[r][c] === state.solution[r][c]) return
    if (!fromPeer) {
      state.history.push({ type: 'erase', r, c, prev: state.board[r][c], prevOwner: state.cellOwners[r][c], prevNotes: new Set(state.notes[r][c]) })
    }
    state.board[r][c] = 0
    state.cellOwners[r][c] = null
    state.notes[r][c].clear()
    return { type: 'erase', r, c }
  }

  function eraseCellAt(r, c, fromPeer = false) {
    if (state.puzzle[r][c] !== 0) return
    if (state.board[r][c] !== 0 && state.board[r][c] === state.solution[r][c]) return
    if (!fromPeer) {
      state.history.push({ type: 'erase', r, c, prev: state.board[r][c], prevOwner: state.cellOwners[r][c], prevNotes: new Set(state.notes[r][c]) })
    }
    state.board[r][c] = 0
    state.cellOwners[r][c] = null
    state.notes[r][c].clear()
  }

  function undo() {
    if (!state.history.length || state.won) return
    const a = state.history.pop()
    if (a.type === 'note') {
      state.notes[a.r][a.c] = a.prev
    } else {
      state.board[a.r][a.c] = a.prev
      state.cellOwners[a.r][a.c] = a.prevOwner || null
      if (a.prevNotes) state.notes[a.r][a.c] = a.prevNotes
      if (a.cleanedNotes && a.cleanedNum) {
        for (const { r, c } of a.cleanedNotes) state.notes[r][c].add(a.cleanedNum)
      }
    }
  }

  function checkWin() {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (state.board[r][c] !== state.solution[r][c]) return
    state.won = true
    state.selected = null
  }

  function select(r, c) {
    state.selected = [r, c]
  }

  function toggleNotes() {
    state.notesMode = !state.notesMode
  }

  function moveSelection(dr, dc) {
    if (!state.selected) return
    state.selected = [
      Math.max(0, Math.min(8, state.selected[0] + dr)),
      Math.max(0, Math.min(8, state.selected[1] + dc)),
    ]
  }

  function applyPeerSync(data) {
    const { raw } = decodeSeed(data.seed)
    state.seedDisplay = data.seed
    state.seed = data.seed
    state.difficulty = data.difficulty
    state.difficultyIdx = DIFF_KEYS.indexOf(data.difficulty)

    const { puzzle, solution } = generatePuzzle(hashSeed(state.seed), DIFFICULTY[state.difficulty])
    state.puzzle = puzzle
    state.solution = solution
    state.board = data.board.map((r) => [...r])
    state.cellOwners = data.cellOwners ? data.cellOwners.map((r) => [...r]) : createEmptyOwners()
    state.notes = createEmptyNotes()
    state.selected = null
    state.mistakes = 0
    state.playerErrors = {}
    state.history = []
    state.won = false
  }

  function applyPeerMove(move) {
    if (move.type === 'place') {
      if (state.board[move.r][move.c] !== 0 && state.board[move.r][move.c] === state.solution[move.r][move.c]) return
      state.board[move.r][move.c] = move.n
      state.cellOwners[move.r][move.c] = move.color || null
      state.notes[move.r][move.c].clear()
      cleanNotesFor(move.r, move.c, move.n)
      if (move.n !== state.solution[move.r][move.c] && move.color) {
        state.playerErrors[move.color] = (state.playerErrors[move.color] || 0) + 1
      }
      checkWin()
    } else if (move.type === 'erase') {
      eraseCellAt(move.r, move.c, true)
    } else if (move.type === 'note') {
      if (state.notes[move.r][move.c].has(move.n)) state.notes[move.r][move.c].delete(move.n)
      else state.notes[move.r][move.c].add(move.n)
    }
  }

  return {
    state,
    init,
    setDifficulty,
    updateSeedDisplay,
    parseSeedInput,
    placeNumber,
    eraseCell,
    undo,
    select,
    toggleNotes,
    moveSelection,
    applyPeerSync,
    applyPeerMove,
  }
}
