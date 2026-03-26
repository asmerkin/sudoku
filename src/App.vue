<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { encodeSeed, randomSeed } from './composables/useSudokuEngine.js'
import { useGameState } from './composables/useGameState.js'
import { useTimer } from './composables/useTimer.js'
import { useToast } from './composables/useToast.js'
import { useCollab } from './composables/useCollab.js'
import { usePrint } from './composables/usePrint.js'

import ThemeToggle from './components/ThemeToggle.vue'
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

const showWin = ref(false)
const pendingRoomId = ref(null)
const joinNameInput = ref('')

const {
  collab,
  createRoom,
  joinRoom,
  broadcastMove,
  broadcastCursor,
  broadcastFullState,
  sendToPeer,
} = useCollab({
  onMove(move) {
    applyPeerMove(move)
  },
  onSync(data) {
    applyPeerSync(data)
    timer.start(data.timerStart)
    toast.show('Sincronizado con host')
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
function onCreateRoom() { createRoom() }
function onJoinRoom(roomId) { joinRoom(roomId) }
function onCopyRoomId(roomId) {
  const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`
  navigator.clipboard.writeText(url).then(() => toast.show('Link copiado'))
}

function confirmJoinName() {
  const name = joinNameInput.value.trim() || 'Anón'
  collab.myName = name
  const roomId = pendingRoomId.value
  pendingRoomId.value = null
  joinRoom(roomId)
}

onMounted(() => {
  const urlRoom = new URLSearchParams(window.location.search).get('room')
  if (urlRoom) pendingRoomId.value = urlRoom
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
      <ThemeToggle />
    </header>

    <CollabBar
      :collab="collab"
      @create-room="onCreateRoom"
      @join-room="onJoinRoom"
      @copy-room-id="onCopyRoomId"
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
      <div v-if="pendingRoomId" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div class="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl w-80 animate-fade-up">
          <h2 class="text-xl font-bold text-text tracking-tight">
            Unirse a partida
          </h2>
          <p class="text-text-muted text-xs text-center font-mono">
            Ingresá tu nombre para que los demás te vean
          </p>
          <input
            v-model="joinNameInput"
            class="bg-bg border border-border text-text font-sans text-base
                   py-2.5 px-4 rounded-lg w-full outline-none text-center
                   focus:border-accent focus:shadow-(--glow) transition-all duration-250"
            placeholder="Tu nombre..."
            maxlength="12"
            autofocus
            @keydown.enter="confirmJoinName"
          />
          <button
            class="bg-accent text-bg font-sans text-sm font-bold
                   tracking-wide px-6 py-2.5 rounded-lg cursor-pointer transition-all duration-250
                   uppercase hover:brightness-110 w-full"
            @click="confirmJoinName"
          >
            Entrar
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
