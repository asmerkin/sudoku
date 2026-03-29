<script setup>
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

defineProps({
  modelValue: { type: Number, default: 0 },
  disabled: Boolean,
})

const emit = defineEmits(['update:modelValue', 'change'])

function onSelect(e) {
  const idx = Number(e.target.value)
  emit('update:modelValue', idx)
  emit('change', idx)
}
</script>

<template>
  <div class="relative inline-flex items-center">
    <select
      :value="modelValue"
      :disabled="disabled"
      class="appearance-none bg-surface border border-border text-accent font-mono text-[0.78rem]
             font-semibold tracking-wide px-3 pr-7 h-8.5 rounded-btn cursor-pointer
             transition-all duration-250 outline-none
             hover:border-accent hover:shadow-(--glow)
             focus:border-accent focus:shadow-(--glow)"
      @change="onSelect"
    >
      <option
        v-for="(label, i) in t('diffLabels')"
        :key="i"
        :value="i"
        class="bg-surface text-text"
      >
        {{ label }}
      </option>
    </select>
    <svg
      class="absolute right-2 pointer-events-none text-accent"
      width="12" height="12" viewBox="0 0 12 12" fill="none"
    >
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</template>
