<script setup>
import { useI18n } from '../composables/useI18n.js'

const { locale, toggleLocale } = useI18n()
</script>

<template>
  <button
    class="lang-toggle-btn absolute -left-12 top-0.5 bg-surface border border-border text-text-dim
           rounded-full cursor-pointer flex items-center justify-center
           leading-none transition-all duration-250 font-mono text-[0.55rem] font-semibold uppercase tracking-wide
           hover:bg-surface-hover hover:text-accent hover:border-accent hover:shadow-(--glow)"
    :title="locale === 'es' ? 'Switch to English' : 'Cambiar a Español'"
    @click="toggleLocale"
  >
    {{ locale === 'es' ? 'EN' : 'ES' }}
  </button>
</template>

<style scoped>
.lang-toggle-btn {
  width: 32px;
  height: 32px;
}
@media (max-width: 480px) {
  .lang-toggle-btn {
    left: -40px;
    width: 28px;
    height: 28px;
    font-size: 0.5rem;
  }
}
</style>
