<script setup>
import DifficultySlider from './DifficultySlider.vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

defineProps({
  seedDisplay: String,
  difficultyIdx: Number,
  variant: { type: String, default: 'sudoku' },
  disabled: Boolean,
})

const emit = defineEmits([
  'update:seedDisplay',
  'update:difficultyIdx',
  'update:variant',
  'difficulty-change',
  'variant-change',
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

function onVariantChange(e) {
  const value = e.target.value
  emit('update:variant', value)
  emit('variant-change', value)
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
        maxlength="12"
        :disabled="disabled"
        class="bg-transparent border-none text-accent font-mono text-[0.78rem] font-semibold
               w-24 outline-none text-center"
        @input="emit('update:seedDisplay', $event.target.value)"
        @keydown="onSeedKeydown"
      />
    </div>
    <div class="relative inline-flex items-center">
      <select
        :value="variant"
        :disabled="disabled"
        class="appearance-none bg-surface border border-border text-accent font-mono text-[0.78rem]
               font-semibold tracking-wide px-3 pr-7 h-8.5 rounded-btn cursor-pointer
               transition-all duration-250 outline-none
               hover:border-accent hover:shadow-(--glow)
               focus:border-accent focus:shadow-(--glow)"
        @change="onVariantChange"
      >
        <option value="sudoku" class="bg-surface text-text">{{ t('variantSudoku') }}</option>
        <option value="hexadoku" class="bg-surface text-text">{{ t('variantHexadoku') }}</option>
      </select>
      <svg
        class="absolute right-2 pointer-events-none text-accent"
        width="12" height="12" viewBox="0 0 12 12" fill="none"
      >
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
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
      {{ t('new') }}
    </button>
    <button
      v-if="variant === 'sudoku'"
      class="bg-surface border border-border text-text-dim font-sans text-[0.68rem] font-medium
             tracking-wide px-3.5 h-8.5 rounded-btn cursor-pointer transition-all duration-250
             uppercase hover:border-accent hover:text-accent hover:bg-accent-glow hover:shadow-(--glow)"
      @click="emit('print')"
    >
      Print 6
    </button>
  </div>
</template>
