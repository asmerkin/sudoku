import {
  generatePuzzle,
  hashSeed,
  DIFFICULTY,
  getVariantConfig,
  formatValue,
} from './useSudokuEngine.js'
import { useI18n } from './useI18n.js'

export function usePrint() {
  const { t } = useI18n()

  function printSudokus(seedValue, difficulty, variant = 'sudoku') {
    const { size } = getVariantConfig(variant)
    const removals = DIFFICULTY[variant][difficulty]
    const numericBase = hashSeed(seedValue)
    let container = document.getElementById('printContainer')
    if (!container) {
      container = document.createElement('div')
      container.id = 'printContainer'
      container.className = 'print-container'
      document.body.appendChild(container)
    }

    const label = variant === 'hexadoku' ? 'Hexadoku' : 'Sudoku'
    const gridClass = variant === 'hexadoku' ? 'print-grid print-grid-hex' : 'print-grid'

    let html = '<div class="print-page">'
    html += `<div class="print-header">${label} — ${t('printDiffLabels')[difficulty]} — Seed: ${seedValue}</div>`

    for (let i = 0; i < 6; i++) {
      const { puzzle } = generatePuzzle(numericBase + i, removals, variant)
      html += '<div class="print-sudoku">'
      html += `<div class="print-label">#${i + 1}</div><table class="${gridClass}">`
      for (let r = 0; r < size; r++) {
        html += '<tr>'
        for (let c = 0; c < size; c++) {
          const v = puzzle[r][c]
          html += `<td class="${v === 0 ? 'empty' : ''}">${v ? formatValue(v) : '&nbsp;'}</td>`
        }
        html += '</tr>'
      }
      html += '</table></div>'
    }

    html += '</div><div class="print-page">'
    html += `<div class="print-header">${t('solutions')}</div>`

    for (let i = 0; i < 6; i++) {
      const { solution } = generatePuzzle(numericBase + i, removals, variant)
      html += '<div class="print-sudoku">'
      html += `<div class="print-label">#${i + 1}</div><table class="${gridClass}">`
      for (let r = 0; r < size; r++) {
        html += '<tr>'
        for (let c = 0; c < size; c++) html += `<td>${formatValue(solution[r][c])}</td>`
        html += '</tr>'
      }
      html += '</table></div>'
    }

    html += '</div>'
    container.innerHTML = html
    setTimeout(() => window.print(), 100)
  }

  return { printSudokus }
}
