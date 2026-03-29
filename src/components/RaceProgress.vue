<script setup>
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

defineProps({
  players: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="w-full max-w-[350px] flex flex-col gap-1.5 mb-3 animate-fade-up">
    <div
      v-for="player in players"
      :key="player.color"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-[0.65rem] font-mono"
    >
      <span
        class="w-2.5 h-2.5 rounded-full shrink-0"
        :style="{ background: player.color }"
      />
      <span class="text-text truncate w-16">{{ player.name }}</span>
      <div class="flex-1 h-2 bg-bg rounded-full overflow-hidden border border-border">
        <div
          class="h-full rounded-full transition-all duration-300 ease-out"
          :style="{
            width: player.total ? (player.correct / player.total * 100) + '%' : '0%',
            background: player.color,
            opacity: player.finished ? 1 : 0.6,
          }"
        />
      </div>
      <span class="text-text-dim tabular-nums w-8 text-right">
        {{ player.total ? Math.round(player.correct / player.total * 100) : 0 }}%
      </span>
      <span v-if="player.finished" class="text-accent text-[0.6rem]">&#10003;</span>
    </div>
  </div>
</template>
