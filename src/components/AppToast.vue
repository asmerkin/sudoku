<script setup>
import { useToast } from '../composables/useToast.js'

const { message, visible } = useToast()
</script>

<template>
  <div
    class="fixed bottom-5 left-1/2 -translate-x-1/2 font-mono text-[0.65rem]
           bg-accent text-[#0e0e12] py-1.5 px-4 rounded-lg
           transition-opacity duration-300 pointer-events-none z-100"
    :class="visible ? 'opacity-100' : 'opacity-0'"
  >
    {{ message }}
  </div>
</template>
