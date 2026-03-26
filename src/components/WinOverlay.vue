<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  seed: String,
  time: String,
  mistakes: Number,
  ranking: Array,
})

const EMOJIS = ['🎉', '✨', '🌟', '🎊', '💫', '🏆', '⭐', '🥳']
const particles = ref([])
let cleanupTimer = null

watch(() => props.show, (val) => {
  if (val) spawnConfetti()
  else particles.value = []
})

function spawnConfetti() {
  const arr = []
  for (let i = 0; i < 35; i++) {
    arr.push({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 60,
      rotation: Math.random() * 720 - 360,
      size: 16 + Math.random() * 12,
    })
  }
  particles.value = arr
  clearTimeout(cleanupTimer)
  cleanupTimer = setTimeout(() => { particles.value = [] }, 6000)
}

onUnmounted(() => clearTimeout(cleanupTimer))
</script>

<template>
  <!-- Confetti burst -->
  <Teleport to="body">
    <div v-if="particles.length" class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <span
        v-for="p in particles"
        :key="p.id"
        class="absolute confetti-particle"
        :style="{
          left: p.left + '%',
          bottom: '-30px',
          fontSize: p.size + 'px',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          '--drift': p.drift + 'px',
          '--rotation': p.rotation + 'deg',
        }"
      >{{ p.emoji }}</span>
    </div>
  </Teleport>

  <!-- Stats banner -->
  <div
    class="overflow-hidden transition-all duration-500 ease-out"
    :class="show ? 'max-h-96 opacity-100 mb-3.5' : 'max-h-0 opacity-0'"
  >
    <div
      class="bg-surface border border-accent/30 rounded-lg px-4 py-2.5 text-center
             shadow-[0_0_20px_var(--accent-glow)]"
    >
      <p class="font-bold text-accent text-sm tracking-tight">{{ t('completed') }}</p>
      <p class="text-text-dim font-mono text-[0.65rem] mt-0.5">
        Seed: {{ seed }} · {{ time }} · {{ t('errors', mistakes) }}
      </p>

      <!-- Multiplayer ranking -->
      <div v-if="ranking && ranking.length" class="mt-2 space-y-0.5">
        <div
          v-for="(player, i) in ranking"
          :key="player.color"
          class="flex items-center gap-2 py-1 px-3 rounded text-[0.65rem] font-mono"
          :class="i === 0 ? 'bg-accent-glow' : ''"
        >
          <span class="font-bold text-text-dim w-3 text-right">{{ i + 1 }}</span>
          <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: player.color }" />
          <span class="text-text flex-1 truncate">{{ player.name }}</span>
          <span class="text-accent tabular-nums">{{ player.correct }}&#10003;</span>
          <span v-if="player.errors" class="text-error tabular-nums">{{ player.errors }}&#10007;</span>
        </div>
      </div>
    </div>
  </div>
</template>
