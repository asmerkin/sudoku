<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  collab: Object,
})

const emit = defineEmits(['create-room', 'join-room', 'copy-room-id'])

const showJoinInput = ref(false)
const joinInput = ref('')

const isConnected = computed(() => props.collab.conns.some((c) => c.open))
const playerCount = computed(() => Object.keys(props.collab.peerCursors).length + 1)

const peerBadges = computed(() => {
  return Object.entries(props.collab.peerCursors).map(([id, data]) => ({
    id,
    label: data.name || 'P',
    color: data.color || '#f59e0b',
  }))
})

function onCreateRoom() {
  emit('create-room')
}

function onJoinSubmit() {
  if (!joinInput.value.trim()) return
  emit('join-room', joinInput.value.trim())
  showJoinInput.value = false
}

function onJoinKeydown(e) {
  if (e.key === 'Enter') onJoinSubmit()
}
</script>

<template>
  <div
    class="flex gap-1.5 items-center justify-center flex-wrap
           max-w-[calc(var(--cell-size)*9)] w-full mb-3 animate-fade-up"
    style="animation-delay: 0.02s"
  >
    <template v-if="!collab.roomId">
      <button
        class="bg-surface border border-border text-text-dim font-sans text-[0.62rem] font-medium
               tracking-wide px-2.5 h-7.5 rounded-btn cursor-pointer transition-all duration-250
               uppercase hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)"
        @click="onCreateRoom"
      >
        {{ t('createRoom') }}
      </button>
      <template v-if="!showJoinInput">
        <button
          class="bg-surface border border-border text-text-dim font-sans text-[0.62rem] font-medium
                 tracking-wide px-2.5 h-7.5 rounded-btn cursor-pointer transition-all duration-250
                 uppercase hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)"
          @click="showJoinInput = true"
        >
          {{ t('join') }}
        </button>
      </template>
      <input
        v-else
        v-model="joinInput"
        class="bg-surface border border-border text-accent font-mono text-[0.7rem] font-semibold
               py-0.5 px-2 rounded-md w-28 outline-none text-center
               focus:border-accent focus:shadow-(--glow)"
        placeholder="Room ID..."
        autofocus
        @keydown="onJoinKeydown"
      />
    </template>

    <template v-if="collab.roomId">
      <!-- Copy link button -->
      <button
        class="bg-surface border border-border text-text-dim font-sans text-[0.62rem] font-medium
               tracking-wide px-2.5 h-7.5 rounded-btn cursor-pointer transition-all duration-250
               uppercase hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)
               flex items-center gap-1"
        @click="emit('copy-room-id', collab.roomId)"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
        {{ t('copyLink') }}
      </button>

      <!-- Connected count -->
      <span class="font-mono text-[0.55rem] text-text-muted flex items-center gap-1.5">
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="isConnected ? 'bg-accent shadow-[0_0_6px_var(--accent)]' : 'bg-text-muted'"
        />
        <span>{{ t('connected', playerCount) }}</span>
      </span>

      <!-- Own badge -->
      <span
        class="inline-flex items-center gap-1 font-mono text-[0.5rem]
               py-0.5 px-1.5 rounded bg-surface border border-border"
      >
        <span class="w-1.5 h-1.5 rounded-full" :style="{ background: collab.myColor || '#6ee7b7' }" />
        {{ collab.myName || t('you') }}
      </span>

      <!-- Peer badges -->
      <span
        v-for="badge in peerBadges"
        :key="badge.id"
        class="inline-flex items-center gap-1 font-mono text-[0.5rem]
               py-0.5 px-1.5 rounded bg-surface border border-border"
      >
        <span class="w-1.5 h-1.5 rounded-full" :style="{ background: badge.color }" />
        {{ badge.label }}
      </span>
    </template>
  </div>
</template>
