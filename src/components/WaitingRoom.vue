<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  collab: Object,
})

const emit = defineEmits(['start-game', 'leave-room'])

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

        <!-- Start button (host only) -->
        <button
          v-if="collab.isHost"
          class="bg-accent text-bg font-sans text-sm font-bold
                 tracking-wide px-6 py-2.5 rounded-lg cursor-pointer transition-all duration-250
                 uppercase hover:brightness-110 w-full"
          @click="emit('start-game')"
        >
          {{ t('startGame') }}
        </button>

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
