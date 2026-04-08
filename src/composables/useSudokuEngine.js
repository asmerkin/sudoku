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

// ── Variants ──
export const VARIANTS = {
  sudoku: { size: 9, box: 3 },
  hexadoku: { size: 16, box: 4 },
}
export const VARIANT_KEYS = ['sudoku', 'hexadoku']

export function getVariantConfig(variant) {
  return VARIANTS[variant] || VARIANTS.sudoku
}

// Display a cell value: 1..9 stay as digits, 10..16 become A..G
export function formatValue(n) {
  if (!n) return ''
  if (n < 10) return String(n)
  return String.fromCharCode(65 + (n - 10)) // A=10 ... G=16
}

// Parse a keyboard character into a numeric value for the given size
export function parseInputChar(ch, size) {
  if (!ch) return null
  const c = ch.toUpperCase()
  if (c >= '1' && c <= '9') {
    const n = c.charCodeAt(0) - 48
    return n <= size ? n : null
  }
  if (size > 9 && c >= 'A' && c <= 'G') {
    const n = 10 + (c.charCodeAt(0) - 65)
    return n <= size ? n : null
  }
  return null
}

// ── Sudoku engine (parameterized by size/box) ──
function isValid(board, row, col, num, size, box) {
  for (let i = 0; i < size; i++) {
    if (board[row][i] === num || board[i][col] === num) return false
  }
  const br = Math.floor(row / box) * box
  const bc = Math.floor(col / box) * box
  for (let r = br; r < br + box; r++)
    for (let c = bc; c < bc + box; c++) if (board[r][c] === num) return false
  return true
}

// Backtracking fill — fast enough for 9x9
function generateSolution9(rng) {
  const size = 9, box = 3
  const board = Array.from({ length: size }, () => Array(size).fill(0))
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  function fill(pos) {
    if (pos === size * size) return true
    const row = Math.floor(pos / size)
    const col = pos % size
    for (const n of seededShuffle(digits, rng)) {
      if (isValid(board, row, col, n, size, box)) {
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

// For 16x16 backtracking is too slow; build a canonical solution and scramble it.
function generateSolution16(rng) {
  const size = 16, box = 4
  const board = Array.from({ length: size }, () => Array(size).fill(0))
  // Canonical latin square respecting box constraints.
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      board[r][c] = ((box * (r % box) + Math.floor(r / box) + c) % size) + 1
    }
  }
  // Scramble: shuffle digits, rows within bands, bands, cols within stacks, stacks.
  const digitPerm = seededShuffle(
    Array.from({ length: size }, (_, i) => i + 1),
    rng,
  )
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) board[r][c] = digitPerm[board[r][c] - 1]

  // Rows within each band
  for (let band = 0; band < box; band++) {
    const idxs = Array.from({ length: box }, (_, i) => band * box + i)
    const order = seededShuffle(idxs, rng)
    const snapshot = idxs.map((i) => board[i])
    for (let i = 0; i < box; i++) board[idxs[i]] = snapshot[order[i] - band * box]
  }
  // Bands
  const bandIdxs = Array.from({ length: box }, (_, i) => i)
  const bandOrder = seededShuffle(bandIdxs, rng)
  const bandSnap = bandIdxs.map((b) =>
    Array.from({ length: box }, (_, i) => board[b * box + i]),
  )
  for (let b = 0; b < box; b++) {
    const src = bandSnap[bandOrder[b]]
    for (let i = 0; i < box; i++) board[b * box + i] = src[i]
  }
  // Columns within each stack
  for (let stack = 0; stack < box; stack++) {
    const idxs = Array.from({ length: box }, (_, i) => stack * box + i)
    const order = seededShuffle(idxs, rng)
    for (let r = 0; r < size; r++) {
      const snapshot = idxs.map((i) => board[r][i])
      for (let i = 0; i < box; i++) board[r][idxs[i]] = snapshot[order[i] - stack * box]
    }
  }
  // Stacks
  const stackOrder = seededShuffle(bandIdxs, rng)
  for (let r = 0; r < size; r++) {
    const copy = []
    for (let s = 0; s < box; s++) {
      for (let i = 0; i < box; i++) copy.push(board[r][stackOrder[s] * box + i])
    }
    board[r] = copy
  }
  return board
}

function generateSolution(rng, size, box) {
  if (size === 9 && box === 3) return generateSolution9(rng)
  if (size === 16 && box === 4) return generateSolution16(rng)
  // Fallback (should not happen with known variants)
  return generateSolution9(rng)
}

// ── Fast bitmask solver with MRV for uniqueness checks ──
function popcount32(x) {
  x = x - ((x >>> 1) & 0x55555555)
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
}

function countSolutions(board, size, box, limit = 2) {
  const rows = new Int32Array(size)
  const cols = new Int32Array(size)
  const boxes = new Int32Array(size)
  const all = ((1 << size) - 1) << 1 // bits 1..size

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = board[r][c]
      if (v !== 0) {
        const m = 1 << v
        rows[r] |= m
        cols[c] |= m
        boxes[Math.floor(r / box) * box + Math.floor(c / box)] |= m
      }
    }
  }

  let count = 0
  function solve() {
    if (count >= limit) return
    // MRV: find the empty cell with the fewest candidates
    let bestR = -1, bestC = -1, bestMask = 0, best = size + 1
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] !== 0) continue
        const used = rows[r] | cols[c] | boxes[Math.floor(r / box) * box + Math.floor(c / box)]
        const mask = all & ~used
        const cnt = popcount32(mask)
        if (cnt < best) {
          best = cnt
          bestR = r
          bestC = c
          bestMask = mask
          if (cnt <= 1) break
        }
      }
      if (best <= 1) break
    }
    if (bestR === -1) {
      count++
      return
    }
    if (best === 0) return
    let m = bestMask
    const bi = Math.floor(bestR / box) * box + Math.floor(bestC / box)
    while (m) {
      const bit = m & -m
      const v = 31 - Math.clz32(bit)
      board[bestR][bestC] = v
      rows[bestR] |= bit
      cols[bestC] |= bit
      boxes[bi] |= bit
      solve()
      board[bestR][bestC] = 0
      rows[bestR] &= ~bit
      cols[bestC] &= ~bit
      boxes[bi] &= ~bit
      if (count >= limit) return
      m &= m - 1
    }
  }
  solve()
  return count
}

export function generatePuzzle(seed, removals, variant = 'sudoku') {
  const { size, box } = getVariantConfig(variant)
  const rng = mulberry32(seed)
  const solution = generateSolution(rng, size, box)
  const puzzle = solution.map((r) => [...r])

  const positions = seededShuffle(
    Array.from({ length: size * size }, (_, i) => [Math.floor(i / size), i % size]),
    rng,
  )

  let removed = 0
  // For hexadoku, skip strict uniqueness checks past a budget — the solver is
  // still fast enough for moderate removal counts but can degrade badly past ~60%.
  const uniquenessBudget = variant === 'hexadoku' ? Math.floor(removals * 0.8) : removals

  for (const [r, c] of positions) {
    if (removed >= removals) break
    const backup = puzzle[r][c]
    puzzle[r][c] = 0
    if (removed < uniquenessBudget) {
      // Deep-copy the board for the solver since it mutates in-place.
      const copy = puzzle.map((row) => [...row])
      if (countSolutions(copy, size, box) === 1) {
        removed++
      } else {
        puzzle[r][c] = backup
      }
    } else {
      removed++
    }
  }
  return { puzzle, solution }
}

// ── Seed encoding ──
// 9x9:   <removals> per difficulty
// 16x16: more conservative to keep solvable puzzles within generation budget
export const DIFFICULTY = {
  sudoku: { easy: 38, medium: 46, hard: 54, expert: 60 },
  hexadoku: { easy: 90, medium: 110, hard: 130, expert: 150 },
}
export const DIFF_KEYS = ['easy', 'medium', 'hard', 'expert']
export const DIFF_SUFFIXES = { easy: 'F', medium: 'M', hard: 'D', expert: 'X' }
const SUFFIX_TO_DIFF = { F: 'easy', M: 'medium', D: 'hard', X: 'expert' }
const SUFFIX_TO_IDX = { F: 0, M: 1, D: 2, X: 3 }

// Encoding format:
//   sudoku:   <raw>-<diff>              e.g. 123-F
//   hexadoku: <raw>-H<diff>             e.g. 123-HF
export function encodeSeed(raw, diff, variant = 'sudoku') {
  const prefix = variant === 'hexadoku' ? 'H' : ''
  return raw + '-' + prefix + DIFF_SUFFIXES[diff]
}

export function decodeSeed(val) {
  const m = val.match(/^(.+)-(H?)([FMDX])$/i)
  if (m) {
    const s = m[3].toUpperCase()
    return {
      raw: m[1],
      difficulty: SUFFIX_TO_DIFF[s] || 'easy',
      idx: SUFFIX_TO_IDX[s] ?? 0,
      variant: m[2].toUpperCase() === 'H' ? 'hexadoku' : 'sudoku',
    }
  }
  return { raw: val, difficulty: null, idx: null, variant: null }
}

export function randomSeed() {
  return String(Math.floor(Math.random() * 99999))
}
