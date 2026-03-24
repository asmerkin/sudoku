<script setup>
defineProps({
  mistakes: Number,
  time: String,
})
</script>

<template>
  <div
    class="flex items-center justify-between max-w-[calc(var(--cell-size)*9)] w-full
           mb-2.5 text-[0.68rem] text-text-muted font-mono animate-fade-up"
    style="animation-delay: 0.08s"
  >
    <span>Errores: {{ mistakes }}</span>
    <span class="text-[0.82rem] font-semibold text-text-dim tracking-wide">{{ time }}</span>
  </div>
</template>
