<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { encodeSeed, randomSeed } from './composables/useSudokuEngine.js'
import { useGameState } from './composables/useGameState.js'
import { useTimer } from './composables/useTimer.js'
import { useToast } from './composables/useToast.js'
import { useCollab } from './composables/useCollab.js'
import { usePrint } from './composables/usePrint.js'
import { useI18n } from './composables/useI18n.js'

import ThemeToggle from './components/ThemeToggle.vue'
import LangToggle from './components/LangToggle.vue'
import CollabBar from './components/CollabBar.vue'
import GameControls from './components/GameControls.vue'
import TimerBar from './components/TimerBar.vue'
import SudokuBoard from './components/SudokuBoard.vue'
import NumPad from './components/NumPad.vue'
import ActionBar from './components/ActionBar.vue'
import WinOverlay from './components/WinOverlay.vue'
import AppToast from './components/AppToast.vue'

const { state, init, setDifficulty, updateSeedDisplay, parseSeedInput, placeNumber, eraseCell, undo, select, toggleNotes, moveSelection, applyPeerSync, applyPeerMove } = useGameState()
const timer = useTimer()
const toast = useToast()
const { printSudokus } = usePrint()
const { t } = useI18n()

const showWin = ref(false)
const pendingAction = ref(null)
const nameInput = ref('')

const {
  collab,
  voice,
  createRoom,
  joinRoom,
  broadcastMove,
  broadcastCursor,
  broadcastFullState,
  sendToPeer,
  setPTT,
} = useCollab({
  onMove(move) {
    applyPeerMove(move)
  },
  onSync(data) {
    applyPeerSync(data)
    timer.start(data.timerStart)
    toast.show(t('syncedWithHost'))
  },
  onHello(peerId) {
    if (collab.isHost) {
      sendToPeer(peerId, {
        type: 'sync',
        seed: state.seedDisplay,
        difficulty: state.difficulty,
        board: state.board.map((r) => [...r]),
        cellOwners: state.cellOwners.map((r) => [...r]),
        timerStart: timer.getStartTime(),
      })
    }
  },
  onCursor() {},
  onToast(msg, ms) { toast.show(msg, ms) },
  onConnChange() {},
})

const playerRanking = computed(() => {
  if (!showWin.value || !collab.roomId) return []

  const correctCounts = {}
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const owner = state.cellOwners[r]?.[c]
      if (owner) correctCounts[owner] = (correctCounts[owner] || 0) + 1
    }
  }

  const colorToName = {}
  if (collab.myColor) colorToName[collab.myColor] = collab.myName || t('you')
  for (const data of Object.values(collab.peerCursors)) {
    if (data.color) colorToName[data.color] = data.name || 'P'
  }

  const allColors = new Set([
    ...Object.keys(correctCounts),
    ...Object.keys(state.playerErrors || {}),
  ])

  const stats = []
  for (const color of allColors) {
    stats.push({
      color,
      name: colorToName[color] || '?',
      correct: correctCounts[color] || 0,
      errors: state.playerErrors[color] || 0,
    })
  }

  return stats.sort((a, b) => b.correct - a.correct || a.errors - b.errors)
})

watch(() => state.won, (won) => {
  if (won) {
    timer.stop()
    setTimeout(() => { showWin.value = true }, 300)
  }
})

function startGame(seedValue) {
  showWin.value = false
  init(seedValue)
  timer.start()
}

function onNewGame() {
  const seed = encodeSeed(randomSeed(), state.difficulty)
  state.seedDisplay = seed
  startGame(seed)
  if (collab.isHost) broadcastFullState(state.seedDisplay, state.difficulty, state.board, state.cellOwners, timer.getStartTime())
}

function onSeedSubmit(input) {
  if (!input) return
  const seed = parseSeedInput(input)
  state.seedDisplay = seed
  startGame(seed)
  if (collab.isHost) broadcastFullState(state.seedDisplay, state.difficulty, state.board, state.cellOwners, timer.getStartTime())
}

function onDifficultyIdxUpdate(idx) {
  setDifficulty(idx)
}

function onDifficultyChange() {
  updateSeedDisplay()
  startGame(state.seedDisplay)
  if (collab.isHost) broadcastFullState(state.seedDisplay, state.difficulty, state.board, state.cellOwners, timer.getStartTime())
}

function onSelect(r, c) {
  select(r, c)
  broadcastCursor(r, c)
}

function onNumber(n) {
  const move = placeNumber(n, false, collab.myColor)
  if (move) broadcastMove(move)
}

function onErase() {
  const move = eraseCell()
  if (move) broadcastMove(move)
}

function onUndo() { undo() }
function onToggleNotes() { toggleNotes() }
function onPrint() { printSudokus(state.seedDisplay || randomSeed(), state.difficulty) }
function onCreateRoom() { pendingAction.value = { type: 'create' } }
function onJoinRoom(roomId) { pendingAction.value = { type: 'join', roomId } }
function onCopyRoomId(roomId) {
  const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`
  navigator.clipboard.writeText(url).then(() => toast.show(t('linkCopied')))
}

function confirmName() {
  const name = nameInput.value.trim() || t('anon')
  collab.myName = name
  const action = pendingAction.value
  pendingAction.value = null
  nameInput.value = ''
  if (action.type === 'create') createRoom()
  else joinRoom(action.roomId)
}

onMounted(() => {
  const urlRoom = new URLSearchParams(window.location.search).get('room')
  if (urlRoom) pendingAction.value = { type: 'join', roomId: urlRoom }
})

function onKeydown(e) {
  if (e.target.tagName === 'INPUT') return
  if (e.key >= '1' && e.key <= '9') onNumber(parseInt(e.key))
  else if (e.key === 'Backspace' || e.key === 'Delete') onErase()
  else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) onUndo()
  else if (e.key === 'n') onToggleNotes()
  else if (e.key === 'ArrowUp') { moveSelection(-1, 0); broadcastCursor(state.selected?.[0], state.selected?.[1]) }
  else if (e.key === 'ArrowDown') { moveSelection(1, 0); broadcastCursor(state.selected?.[0], state.selected?.[1]) }
  else if (e.key === 'ArrowLeft') { moveSelection(0, -1); broadcastCursor(state.selected?.[0], state.selected?.[1]) }
  else if (e.key === 'ArrowRight') { moveSelection(0, 1); broadcastCursor(state.selected?.[0], state.selected?.[1]) }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

startGame(encodeSeed(randomSeed(), state.difficulty))
</script>

<template>
  <div class="flex flex-col items-center w-full min-h-dvh p-5 px-4 font-sans text-text select-none">
    <!-- GitHub corner ribbon (github.com/tholman/github-corners) -->
    <a
      href="https://github.com/asmerkin/sudoku"
      target="_blank"
      rel="noopener"
      class="github-corner fixed top-0 right-0 z-40"
      :aria-label="t('viewOnGitHub')"
    >
      <svg width="70" height="70" viewBox="0 0 250 250" style="color:var(--bg)">
        <path d="M0 0l115 115h15l12 27 108 108V0z" class="fill-accent opacity-80 hover:opacity-100 transition-opacity duration-250" />
        <path d="M128.3 109c-14.5-9.3-9.3-19.4-9.3-19.4 3-6.9 1.5-11 1.5-11-1.3-6.6 2.9-2.3 2.9-2.3 3.9 4.6 2.1 11 2.1 11-2.6 10.3 5.1 14.6 8.9 15.9" fill="currentColor" style="transform-origin:130px 106px" class="octo-arm" />
        <path d="M115 115s4.5 2.9 6.2.7l15.8-15.7c3-2 5.5-2.4 7.5-2.1-7.9-10-13.7-23.2 1.8-38.9 4.5-4.5 9.8-6.6 15.2-6.8.5-1.5 3.2-7.2 11.1-10.6 0 0 4.5 2.2 6.9 15.5 4 2.3 7.8 5.3 11.2 8.8 3.4 3.4 6.4 7.3 8.6 11.4 13.3 2.5 15.5 7 15.5 7-3.5 8-9.2 10.8-10.5 11.3-.3 5.6-2.2 10.8-6.7 15.3-16 16-28.9 10-39.3 1.9-0.3 2.5-1.4 6.2-5.1 10l-12.7 12.6c-1.1 1.1.5 5.1.7 5.1z" fill="currentColor" class="octo-body" />
      </svg>
    </a>

    <header class="text-center mb-5 relative animate-fade-up">
      <h1 class="font-bold text-3xl tracking-tight text-text leading-none transition-colors duration-250">
        sudo<span class="text-accent transition-colors duration-250">ku</span>
      </h1>
      <p class="font-mono text-[0.55rem] text-text-muted tracking-[0.22em] uppercase mt-1">
        seeded puzzle generator
      </p>
      <LangToggle />
      <ThemeToggle />
    </header>

    <CollabBar
      :collab="collab"
      :mic-ready="voice.micReady"
      :is-talking="voice.isTalking"
      :mic-error="voice.micError"
      @create-room="onCreateRoom"
      @join-room="onJoinRoom"
      @copy-room-id="onCopyRoomId"
      @ptt-start="setPTT(true)"
      @ptt-end="setPTT(false)"
    />

    <GameControls
      :seed-display="state.seedDisplay"
      :difficulty-idx="state.difficultyIdx"
      :disabled="collab.roomId && !collab.isHost"
      @update:seed-display="state.seedDisplay = $event"
      @update:difficulty-idx="onDifficultyIdxUpdate"
      @difficulty-change="onDifficultyChange"
      @new-game="onNewGame"
      @seed-submit="onSeedSubmit"
      @print="onPrint"
    />

    <TimerBar :mistakes="state.mistakes" :time="timer.display.value" />

    <div
      class="relative mb-3.5 animate-fade-up"
      :class="{ 'win-glow': showWin }"
      style="animation-delay: 0.12s"
    >
      <SudokuBoard
        :state="state"
        :peer-cursors="collab.peerCursors"
        :won="showWin"
        @select="onSelect"
      />
    </div>

    <WinOverlay
      :show="showWin"
      :seed="state.seed"
      :time="timer.display.value"
      :mistakes="state.mistakes"
      :ranking="playerRanking"
    />

    <NumPad :board="state.board" @number="onNumber" />

    <ActionBar
      :notes-mode="state.notesMode"
      @toggle-notes="onToggleNotes"
      @erase="onErase"
      @undo="onUndo"
    />

    <AppToast />

    <!-- Name modal for URL-based join -->
    <Teleport to="body">
      <div v-if="pendingAction" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div class="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl w-80 animate-fade-up">
          <h2 class="text-xl font-bold text-text tracking-tight">
            {{ pendingAction.type === 'create' ? t('createRoom') : t('joinGame') }}
          </h2>
          <p class="text-text-muted text-xs text-center font-mono">
            {{ t('enterNamePrompt') }}
          </p>
          <input
            v-model="nameInput"
            class="bg-bg border border-border text-text font-sans text-base
                   py-2.5 px-4 rounded-lg w-full outline-none text-center
                   focus:border-accent focus:shadow-(--glow) transition-all duration-250"
            :placeholder="t('namePlaceholder')"
            maxlength="12"
            autofocus
            @keydown.enter="confirmName"
          />
          <button
            class="bg-accent text-bg font-sans text-sm font-bold
                   tracking-wide px-6 py-2.5 rounded-lg cursor-pointer transition-all duration-250
                   uppercase hover:brightness-110 w-full"
            @click="confirmName"
          >
            {{ pendingAction.type === 'create' ? t('create') : t('enter') }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
