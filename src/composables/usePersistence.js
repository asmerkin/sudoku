const STORAGE_KEY = 'sudoku-progress'

function serializeNotes(notes) {
  return notes.map(row => row.map(s => Array.from(s)))
}

function deserializeNotes(notes) {
  return notes.map(row => row.map(arr => new Set(arr)))
}

function serializeHistory(history) {
  return history.map(h => {
    const entry = { ...h }
    if (h.prevNotes instanceof Set) entry.prevNotes = Array.from(h.prevNotes)
    if (h.prev instanceof Set) entry.prev = { _set: Array.from(h.prev) }
    return entry
  })
}

function deserializeHistory(history) {
  return history.map(h => {
    const entry = { ...h }
    if (Array.isArray(h.prevNotes)) entry.prevNotes = new Set(h.prevNotes)
    if (h.prev && typeof h.prev === 'object' && h.prev._set) entry.prev = new Set(h.prev._set)
    return entry
  })
}

export function saveProgress(state, timerStartTime) {
  try {
    const data = {
      board: state.board,
      puzzle: state.puzzle,
      solution: state.solution,
      notes: serializeNotes(state.notes),
      seed: state.seed,
      seedDisplay: state.seedDisplay,
      difficulty: state.difficulty,
      difficultyIdx: state.difficultyIdx,
      mistakes: state.mistakes,
      history: serializeHistory(state.history),
      timerStart: timerStartTime,
      won: state.won,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data.board || !data.puzzle || !data.solution) return null
    data.notes = deserializeNotes(data.notes)
    data.history = deserializeHistory(data.history || [])
    return data
  } catch {
    clearProgress()
    return null
  }
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY)
}
