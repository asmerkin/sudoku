<script setup>
import { useTheme } from '../composables/useTheme.js'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    class="theme-toggle-btn absolute -right-12 top-0.5 bg-surface border border-border text-text-dim
           rounded-full cursor-pointer flex items-center justify-center
           leading-none transition-all duration-250
           hover:bg-surface-hover hover:text-accent hover:border-accent hover:shadow-(--glow)"
    title="Cambiar tema"
    @click="toggleTheme"
  >
    {{ theme === 'dark' ? '☀' : '☾' }}
  </button>
</template>

<style scoped>
.theme-toggle-btn {
  width: 32px;
  height: 32px;
  font-size: 0.95rem;
}
@media (max-width: 480px) {
  .theme-toggle-btn {
    right: -40px;
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}
</style>
