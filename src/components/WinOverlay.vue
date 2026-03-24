<script setup>
defineProps({
  show: Boolean,
  seed: String,
  time: String,
  mistakes: Number,
})
</script>

<template>
  <div
    class="absolute inset-0 bg-overlay-bg flex flex-col items-center justify-center
           rounded-md transition-opacity duration-500 backdrop-blur-sm"
    :class="show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
  >
    <h2 class="font-bold text-2xl text-accent mb-1 tracking-tight">Completado</h2>
    <p class="text-text-dim font-mono text-[0.65rem]">
      Seed: {{ seed }} · {{ time }} · {{ mistakes }}
      error{{ mistakes !== 1 ? 'es' : '' }}
    </p>
  </div>
</template>
