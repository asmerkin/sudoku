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
import PrintContainer from './components/PrintContainer.vue'

const { state, init, setDifficulty, updateSeedDisplay, parseSeedInput, placeNumber, eraseCell, undo, select, toggleNotes, moveSelection, applyPeerSync, applyPeerMove } = useGameState()
const timer = useTimer()
const toast = useToast()
const { printSudokus } = usePrint()

const showWin = ref(false)

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
    timer.start()
    toast.show('Sincronizado con host')
  },
  onHello(peerId) {
    if (collab.isHost) {
      sendToPeer(peerId, {
        type: 'sync',
        seed: state.seedDisplay,
        difficulty: state.difficulty,
        board: state.board.map((r) => [...r]),
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
  if (collab.isHost) broadcastFullState(state.seedDisplay, state.difficulty, state.board)
}

function onSeedSubmit(input) {
  if (!input) return
  const seed = parseSeedInput(input)
  state.seedDisplay = seed
  startGame(seed)
  if (collab.isHost) broadcastFullState(state.seedDisplay, state.difficulty, state.board)
}

function onDifficultyIdxUpdate(idx) {
  setDifficulty(idx)
}

function onDifficultyChange() {
  updateSeedDisplay()
  startGame(state.seedDisplay)
  if (collab.isHost) broadcastFullState(state.seedDisplay, state.difficulty, state.board)
}

function onSelect(r, c) {
  select(r, c)
  broadcastCursor(r, c)
}

function onNumber(n) {
  const move = placeNumber(n)
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

onMounted(() => {
  const urlRoom = new URLSearchParams(window.location.search).get('room')
  if (urlRoom) setTimeout(() => joinRoom(urlRoom), 500)
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
      @update:seed-display="state.seedDisplay = $event"
      @update:difficulty-idx="onDifficultyIdxUpdate"
      @difficulty-change="onDifficultyChange"
      @new-game="onNewGame"
      @seed-submit="onSeedSubmit"
      @print="onPrint"
    />

    <TimerBar :mistakes="state.mistakes" :time="timer.display.value" />

    <div class="relative mb-3.5 animate-fade-up" style="animation-delay: 0.12s">
      <SudokuBoard
        :state="state"
        :peer-cursors="collab.peerCursors"
        @select="onSelect"
      />
      <WinOverlay
        :show="showWin"
        :seed="state.seed"
        :time="timer.display.value"
        :mistakes="state.mistakes"
      />
    </div>

    <NumPad :board="state.board" @number="onNumber" />

    <ActionBar
      :notes-mode="state.notesMode"
      @toggle-notes="onToggleNotes"
      @erase="onErase"
      @undo="onUndo"
    />

    <PrintContainer />
    <AppToast />
  </div>
</template>
