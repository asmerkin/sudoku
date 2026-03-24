<script setup>
import DifficultySlider from './DifficultySlider.vue'

defineProps({
  seedDisplay: String,
  difficultyIdx: Number,
  disabled: Boolean,
})

const emit = defineEmits([
  'update:seedDisplay',
  'update:difficultyIdx',
  'difficulty-change',
  'new-game',
  'seed-submit',
  'print',
])

function onSeedKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('seed-submit', e.target.value.trim())
  }
}
</script>

<template>
  <div
    class="flex gap-2 mb-3.5 flex-wrap justify-center items-center animate-fade-up"
    :class="{ 'opacity-40 pointer-events-none': disabled }"
    style="animation-delay: 0.04s"
  >
    <div
      class="flex items-center gap-1.5 bg-surface border border-border rounded-btn
             px-3 h-8.5 transition-all duration-250
             focus-within:border-accent focus-within:shadow-(--glow)"
    >
      <label class="font-mono text-[0.55rem] text-text-muted uppercase tracking-wide">seed</label>
      <input
        type="text"
        :value="seedDisplay"
        maxlength="10"
        :disabled="disabled"
        class="bg-transparent border-none text-accent font-mono text-[0.78rem] font-semibold
               w-22.5 outline-none text-center"
        @input="emit('update:seedDisplay', $event.target.value)"
        @keydown="onSeedKeydown"
      />
    </div>
    <DifficultySlider
      :model-value="difficultyIdx"
      :disabled="disabled"
      @update:model-value="emit('update:difficultyIdx', $event)"
      @change="emit('difficulty-change', $event)"
    />
    <button
      :disabled="disabled"
      class="bg-surface border border-border text-text-dim font-sans text-[0.68rem] font-medium
             tracking-wide px-3.5 h-8.5 rounded-btn cursor-pointer transition-all duration-250
             uppercase hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)"
      @click="emit('new-game')"
    >
      Nuevo
    </button>
    <button
      class="bg-surface border border-border text-text-dim font-sans text-[0.68rem] font-medium
             tracking-wide px-3.5 h-8.5 rounded-btn cursor-pointer transition-all duration-250
             uppercase hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)"
      @click="emit('print')"
    >
      Print 6
    </button>
  </div>
</template>
