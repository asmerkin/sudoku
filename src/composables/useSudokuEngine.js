// ── PRNG ──
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return h
}

// ── Sudoku Engine ──
function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) if (board[row][i] === num || board[i][col] === num) return false
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++) if (board[r][c] === num) return false
  return true
}

function generateSolution(rng) {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0))
  function fill(pos) {
    if (pos === 81) return true
    const row = Math.floor(pos / 9)
    const col = pos % 9
    for (const n of seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
      if (isValid(board, row, col, n)) {
        board[row][col] = n
        if (fill(pos + 1)) return true
        board[row][col] = 0
      }
    }
    return false
  }
  fill(0)
  return board
}

function countSolutions(board, limit = 2) {
  let count = 0
  function solve(pos) {
    if (count >= limit) return
    if (pos === 81) {
      count++
      return
    }
    const r = Math.floor(pos / 9)
    const c = pos % 9
    if (board[r][c] !== 0) {
      solve(pos + 1)
      return
    }
    for (let n = 1; n <= 9; n++) {
      if (isValid(board, r, c, n)) {
        board[r][c] = n
        solve(pos + 1)
        board[r][c] = 0
      }
    }
  }
  solve(0)
  return count
}

export function generatePuzzle(seed, removals) {
  const rng = mulberry32(seed)
  const solution = generateSolution(rng)
  const puzzle = solution.map((r) => [...r])
  const positions = seededShuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]),
    rng,
  )
  let removed = 0
  for (const [r, c] of positions) {
    if (removed >= removals) break
    const backup = puzzle[r][c]
    puzzle[r][c] = 0
    if (countSolutions(puzzle.map((r) => [...r])) === 1) removed++
    else puzzle[r][c] = backup
  }
  return { puzzle, solution }
}

// ── Seed encoding ──
export const DIFFICULTY = { easy: 38, medium: 46, hard: 54, expert: 60 }
export const DIFF_KEYS = ['easy', 'medium', 'hard', 'expert']
export const DIFF_SUFFIXES = { easy: 'F', medium: 'M', hard: 'D', expert: 'X' }
const SUFFIX_TO_DIFF = { F: 'easy', M: 'medium', D: 'hard', X: 'expert' }
const SUFFIX_TO_IDX = { F: 0, M: 1, D: 2, X: 3 }

export function encodeSeed(raw, diff) {
  return raw + '-' + DIFF_SUFFIXES[diff]
}

export function decodeSeed(val) {
  const m = val.match(/^(.+)-([FMDX])$/i)
  if (m) {
    const s = m[2].toUpperCase()
    return { raw: m[1], difficulty: SUFFIX_TO_DIFF[s] || 'easy', idx: SUFFIX_TO_IDX[s] ?? 0 }
  }
  return { raw: val, difficulty: null, idx: null }
}

export function randomSeed() {
  return String(Math.floor(Math.random() * 99999))
}
