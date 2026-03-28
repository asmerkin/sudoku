<script setup>
import { useI18n } from '../composables/useI18n.js'

defineProps({
  notesMode: Boolean,
})

const emit = defineEmits(['toggle-notes', 'erase', 'undo'])
const { t } = useI18n()
</script>

<template>
  <div
    class="flex gap-1.5 justify-center flex-wrap max-w-[calc(var(--cell-size)*9)]
           animate-fade-up"
    style="animation-delay: 0.2s"
  >
    <button
      class="btn flex-1 min-w-17.5 flex items-center justify-center gap-1.5 relative"
      :class="notesMode ? 'btn-notes-active' : ''"
      @click="emit('toggle-notes')"
    >
      <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      {{ t('notes') }}
      <span class="font-mono text-[0.45rem] bg-surface border border-border text-text-muted
                    py-px px-1 rounded-sm ml-0.5 tracking-normal normal-case leading-snug">N</span>
    </button>
    <button
      class="btn flex-1 min-w-17.5 flex items-center justify-center gap-1.5 relative"
      @click="emit('erase')"
    >
      <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 5H9l-7 7 7 7h11a2 2 0 002-2V7a2 2 0 00-2-2z" />
        <line x1="18" y1="9" x2="12" y2="15" />
        <line x1="12" y1="9" x2="18" y2="15" />
      </svg>
      {{ t('erase') }}
      <span class="font-mono text-[0.45rem] bg-surface border border-border text-text-muted
                    py-px px-1 rounded-sm ml-0.5 tracking-normal normal-case leading-snug">Del</span>
    </button>
    <button
      class="btn flex-1 min-w-17.5 flex items-center justify-center gap-1.5 relative"
      @click="emit('undo')"
    >
      <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 105.64-10.36L1 10" />
      </svg>
      {{ t('undo') }}
      <span class="font-mono text-[0.45rem] bg-surface border border-border text-text-muted
                    py-px px-1 rounded-sm ml-0.5 tracking-normal normal-case leading-snug">⌘Z</span>
    </button>
  </div>
</template>

<style scoped>
@reference "../../src/style.css";

.btn {
  @apply bg-surface border border-border text-text-dim font-sans text-[0.68rem]
         font-medium tracking-wide px-3.5 h-8.5 rounded-btn cursor-pointer
         transition-all duration-250 uppercase outline-none;
}
.btn:hover {
  @apply border-accent text-accent bg-accent-glow shadow-(--glow);
}
.btn-notes-active {
  @apply border-accent! text-accent! bg-accent-dim! shadow-(--glow)!;
}
.btn-notes-active:hover {
  @apply border-accent! text-accent! bg-accent-dim! shadow-(--glow)!;
}
</style>
