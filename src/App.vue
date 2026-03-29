<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { decodeSeed, encodeSeed, randomSeed } from './composables/useSudokuEngine.js'
import { useGameState } from './composables/useGameState.js'
import { useTimer } from './composables/useTimer.js'
import { useToast } from './composables/useToast.js'
import { useCollab } from './composables/useCollab.js'
import { usePrint } from './composables/usePrint.js'
import { useI18n } from './composables/useI18n.js'
import { useHaptics } from './composables/useHaptics.js'
import { useTheme } from './composables/useTheme.js'

import ThemeToggle from './components/ThemeToggle.vue'
import LangToggle from './components/LangToggle.vue'
import CollabBar from './components/CollabBar.vue'
import GameControls from './components/GameControls.vue'
import TimerBar from './components/TimerBar.vue'
import SudokuBoard from './components/SudokuBoard.vue'
import NumPad from './components/NumPad.vue'
import ActionBar from './components/ActionBar.vue'
import WaitingRoom from './components/WaitingRoom.vue'
import WinOverlay from './components/WinOverlay.vue'
import AppToast from './components/AppToast.vue'

const { state, init, setDifficulty, updateSeedDisplay, parseSeedInput, placeNumber, eraseCell, undo, select, toggleNotes, moveSelection, applyPeerSync, applyPeerMove } = useGameState()
const timer = useTimer()
const toast = useToast()
const { printSudokus } = usePrint()
const { t } = useI18n()
const haptics = useHaptics()
const { theme } = useTheme()

const showWin = ref(false)
const pendingAction = ref(null)
const nameInput = ref('')

const {
  collab,
  voice,
  createRoom,
  joinRoom,
  leaveRoom,
  broadcastMove,
  broadcastCursor,
  broadcastFullState,
  sendToPeer,
  requestNewGame,
  broadcastStartGame,
  setPTT,
  initMicAndConnect,
} = useCollab({
  onMove(move) {
    applyPeerMove(move)
  },
  onSync(data) {
    showWin.value = false
    applyPeerSync(data)
    timer.start(data.timerStart)
    toast.show(t('syncedWithHost'))
  },
  onHello(peerId) {
    if (collab.isHost && !collab.waiting) {
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
  onNewGameRequest() { onNewGame() },
  onStartGame(data) {
    showWin.value = false
    applyPeerSync(data)
    timer.start(data.timerStart)
    toast.show(t('gameStarted'))
  },
})

// Override accent color to match assigned multiplayer color
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

watch(
  () => [collab.myColor, theme.value],
  ([color, currentTheme]) => {
    const el = document.documentElement.style
    if (!color) {
      el.removeProperty('--accent')
      el.removeProperty('--accent-dim')
      el.removeProperty('--accent-glow')
      el.removeProperty('--input')
      el.removeProperty('--highlight')
      el.removeProperty('--glow')
      return
    }
    const rgb = hexToRgb(color)
    const isDark = currentTheme === 'dark'
    el.setProperty('--accent', color)
    el.setProperty('--accent-dim', `rgba(${rgb},${isDark ? 0.12 : 0.10})`)
    el.setProperty('--accent-glow', `rgba(${rgb},${isDark ? 0.06 : 0.05})`)
    el.setProperty('--input', color)
    el.setProperty('--highlight', `rgba(${rgb},${isDark ? 0.05 : 0.06})`)
    el.setProperty('--glow', isDark ? `0 0 16px rgba(${rgb},0.1)` : 'none')
  },
)

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

watch(() => state.mistakes, () => { haptics.error() })

watch(() => state.won, (won) => {
  if (won) {
    timer.stop()
    haptics.success()
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
  haptics.medium()
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
  haptics.selection()
}

function onNumber(n) {
  const move = placeNumber(n, false, collab.myColor)
  if (move) {
    broadcastMove(move)
    haptics.light()
  }
}

function onErase() {
  const move = eraseCell()
  if (move) {
    broadcastMove(move)
    haptics.light()
  }
}

function onUndo() { undo(); haptics.light() }
function onToggleNotes() { toggleNotes(); haptics.selection() }
function onPrint() { printSudokus(state.seedDisplay || randomSeed(), state.difficulty) }
function onStartFromWaitingRoom() {
  const seed = encodeSeed(randomSeed(), state.difficulty)
  state.seedDisplay = seed
  showWin.value = false
  init(seed)
  timer.start()
  haptics.medium()
  broadcastStartGame(state.seedDisplay, state.difficulty, state.board, state.cellOwners, timer.getStartTime())
}

function onCreateRoom() { pendingAction.value = { type: 'create' } }
function onJoinRoom(roomId) { pendingAction.value = { type: 'join', roomId } }
function onLeaveRoom() {
  leaveRoom()
  haptics.medium()
}

async function onPttStart() {
  if (!voice.micReady) {
    await initMicAndConnect()
    if (!voice.micReady) return
  }
  setPTT(true)
  haptics.medium()
}

async function onCopyRoomId(roomId) {
  const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`
  if (navigator.share) {
    try {
      await navigator.share({ url })
    } catch (err) {
      if (err.name !== 'AbortError') {
        navigator.clipboard.writeText(url).then(() => toast.show(t('linkCopied')))
      }
    }
  } else {
    navigator.clipboard.writeText(url).then(() => toast.show(t('linkCopied')))
  }
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
  const params = new URLSearchParams(window.location.search)
  const urlRoom = params.get('room')
  const urlSeed = params.get('seed')
  if (urlRoom) {
    pendingAction.value = { type: 'join', roomId: urlRoom }
  } else if (urlSeed) {
    const decoded = decodeSeed(urlSeed)
    if (decoded.difficulty) setDifficulty(decoded.idx)
    const seed = decoded.difficulty ? urlSeed : encodeSeed(decoded.raw, state.difficulty)
    state.seedDisplay = seed
    startGame(seed)
    window.history.replaceState({}, '', window.location.pathname)
  }
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
      @leave-room="onLeaveRoom"
      @ptt-start="onPttStart()"
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

    <WaitingRoom
      v-if="collab.waiting"
      :collab="collab"
      @start-game="onStartFromWaitingRoom"
      @copy-room-id="onCopyRoomId"
      @leave-room="onLeaveRoom"
    />

    <WinOverlay
      :show="showWin"
      :seed="state.seed"
      :time="timer.display.value"
      :mistakes="state.mistakes"
      :ranking="playerRanking"
      :is-host="collab.isHost"
      :is-multiplayer="!!collab.roomId"
      @new-game="onNewGame"
      @request-new-game="requestNewGame"
    />

    <NumPad :board="state.board" @number="onNumber" />

    <ActionBar
      :notes-mode="state.notesMode"
      @toggle-notes="onToggleNotes"
      @erase="onErase"
      @undo="onUndo"
    />

    <AppToast />

    <!-- GitHub link -->
    <a
      href="https://github.com/asmerkin/sudoku"
      target="_blank"
      rel="noopener"
      class="mt-6 mb-2 inline-flex items-center gap-1.5 text-text-muted font-mono text-[0.55rem]
             tracking-wide opacity-40 hover:opacity-80 transition-opacity duration-250"
      :aria-label="t('viewOnGitHub')"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
      GitHub
    </a>

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
