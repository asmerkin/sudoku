<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  collab: Object,
  gameMode: { type: String, default: 'battle' },
})

const emit = defineEmits(['start-game', 'leave-room', 'copy-room-id', 'update:game-mode'])

const canNativeShare = !!navigator.share

const players = computed(() => {
  const list = []
  // Add self
  list.push({
    id: 'self',
    name: props.collab.myName || t('you'),
    color: props.collab.myColor || '#6ee7b7',
    isHost: props.collab.isHost,
  })
  // Add peers
  for (const [id, data] of Object.entries(props.collab.peerCursors)) {
    list.push({
      id,
      name: data.name || 'P',
      color: data.color || '#f59e0b',
      isHost: false,
    })
  }
  return list
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl w-80 animate-fade-up">
        <h2 class="text-xl font-bold text-text tracking-tight">
          {{ t('waitingRoom') }}
        </h2>
        <p class="text-text-muted text-xs text-center font-mono">
          {{ collab.isHost ? t('waitingRoomHostHint') : t('waitingRoomGuestHint') }}
        </p>

        <!-- Player list -->
        <div class="w-full flex flex-col gap-2">
          <div
            v-for="player in players"
            :key="player.id"
            class="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg border border-border"
          >
            <span
              class="w-3 h-3 rounded-full shrink-0"
              :style="{ background: player.color }"
            />
            <span class="font-sans text-sm text-text truncate flex-1">
              {{ player.name }}
            </span>
            <span
              v-if="player.isHost"
              class="font-mono text-[0.5rem] text-accent uppercase tracking-wider"
            >
              host
            </span>
            <span
              v-if="player.id === 'self'"
              class="font-mono text-[0.5rem] text-text-muted uppercase tracking-wider"
            >
              {{ t('you') }}
            </span>
          </div>
        </div>

        <!-- Waiting animation for guests -->
        <div v-if="!collab.isHost" class="flex items-center gap-2 text-text-muted text-xs font-mono">
          <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          {{ t('waitingForHost') }}
        </div>

        <!-- Game mode selector -->
        <div v-if="collab.isHost" class="w-full flex rounded-lg border border-border overflow-hidden">
          <button
            class="flex-1 py-2 text-[0.7rem] font-bold uppercase tracking-wide transition-all duration-250 cursor-pointer"
            :class="gameMode === 'battle'
              ? 'bg-accent text-bg'
              : 'bg-surface text-text-muted hover:text-text'"
            @click="emit('update:game-mode', 'battle')"
          >
            {{ t('modeBattle') }}
          </button>
          <button
            class="flex-1 py-2 text-[0.7rem] font-bold uppercase tracking-wide transition-all duration-250 cursor-pointer"
            :class="gameMode === 'race'
              ? 'bg-accent text-bg'
              : 'bg-surface text-text-muted hover:text-text'"
            @click="emit('update:game-mode', 'race')"
          >
            {{ t('modeRace') }}
          </button>
        </div>
        <p class="text-text-muted text-[0.6rem] font-mono text-center -mt-2">
          {{ gameMode === 'race' ? t('modeRaceHint') : t('modeBattleHint') }}
        </p>

        <!-- Copy link + Start button (host only) -->
        <template v-if="collab.isHost">
          <button
            class="bg-surface border border-border text-text-dim font-sans text-[0.7rem] font-medium
                   tracking-wide px-4 py-2 rounded-lg cursor-pointer transition-all duration-250
                   uppercase hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)
                   w-full flex items-center justify-center gap-2"
            @click="emit('copy-room-id', collab.roomId)"
          >
            <svg v-if="canNativeShare" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            {{ canNativeShare ? t('shareLink') : t('copyLink') }}
          </button>

          <button
            class="bg-accent text-bg font-sans text-sm font-bold
                   tracking-wide px-6 py-2.5 rounded-lg cursor-pointer transition-all duration-250
                   uppercase hover:brightness-110 w-full"
            @click="emit('start-game')"
          >
            {{ t('startGame') }}
          </button>
        </template>

        <!-- Leave button -->
        <button
          class="bg-surface border border-border text-text-muted font-sans text-[0.7rem] font-medium
                 tracking-wide px-4 py-2 rounded-lg cursor-pointer transition-all duration-250
                 uppercase hover:border-red-400 hover:text-red-400 w-full"
          @click="emit('leave-room')"
        >
          {{ t('leaveRoom') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>
