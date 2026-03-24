<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  collab: Object,
})

const emit = defineEmits(['create-room', 'join-room', 'copy-room-id'])

const showJoinInput = ref(false)
const joinInput = ref('')

const roomUrl = computed(() => {
  if (!props.collab.roomId) return ''
  const base = window.location.origin + window.location.pathname
  return `${base}?room=${props.collab.roomId}`
})

const isConnected = computed(() => props.collab.conns.some((c) => c.open))
const playerCount = computed(() => props.collab.conns.filter((c) => c.open).length)

const peerBadges = computed(() => {
  return props.collab.conns
    .filter((c) => c.open)
    .map((conn, i) => ({
      id: conn.peer,
      label: 'P' + (i + 2),
      color: props.collab.peerCursors[conn.peer]?.color || '#f59e0b',
    }))
})

function onJoinKeydown(e) {
  if (e.key === 'Enter' && joinInput.value.trim()) {
    emit('join-room', joinInput.value.trim())
    showJoinInput.value = false
  }
}
</script>

<template>
  <div
    class="flex gap-1.5 items-center justify-center flex-wrap
           max-w-[calc(var(--cell-size)*9)] w-full mb-3 animate-fade-up"
    style="animation-delay: 0.02s"
  >
    <span
      v-if="collab.roomId"
      class="font-mono text-[0.6rem] font-semibold text-accent bg-surface border border-border
             py-0.5 px-2.5 rounded-md cursor-pointer transition-all duration-250
             hover:border-accent hover:shadow-(--glow) truncate max-w-64"
      title="Click para copiar link"
      @click="emit('copy-room-id', collab.roomId)"
    >
      🔗 {{ roomUrl }}
    </span>

    <template v-if="!collab.roomId">
      <button
        class="bg-surface border border-border text-text-dim font-sans text-[0.62rem] font-medium
               tracking-wide px-2.5 h-7.5 rounded-btn cursor-pointer transition-all duration-250
               uppercase hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)"
        @click="emit('create-room')"
      >
        Crear sala
      </button>
      <template v-if="!showJoinInput">
        <button
          class="bg-surface border border-border text-text-dim font-sans text-[0.62rem] font-medium
                 tracking-wide px-2.5 h-7.5 rounded-btn cursor-pointer transition-all duration-250
                 uppercase hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)"
          @click="showJoinInput = true"
        >
          Unirse
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

    <span v-if="collab.roomId" class="font-mono text-[0.55rem] text-text-muted flex items-center gap-1.5">
      <span
        class="w-1.5 h-1.5 rounded-full"
        :class="isConnected ? 'bg-accent shadow-[0_0_6px_var(--accent)]' : 'bg-text-muted'"
      />
      <span>{{ playerCount > 0 ? `${playerCount + 1} jugadores` : 'Esperando...' }}</span>
    </span>

    <span
      v-for="badge in peerBadges"
      :key="badge.id"
      class="inline-flex items-center gap-1 font-mono text-[0.5rem]
             py-0.5 px-1.5 rounded bg-surface border border-border"
    >
      <span class="w-1.5 h-1.5 rounded-full" :style="{ background: badge.color }" />
      {{ badge.label }}
    </span>
  </div>
</template>
