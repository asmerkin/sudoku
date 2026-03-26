<script setup>
const props = defineProps({
  row: Number,
  col: Number,
  value: Number,
  isGiven: Boolean,
  isSelected: Boolean,
  isHighlighted: Boolean,
  isError: Boolean,
  isSameNumber: Boolean,
  notes: Set,
  peerCursors: Array,
  ownerColor: String,
})

const emit = defineEmits(['select'])
</script>

<template>
  <div
    class="cell flex items-center justify-center font-mono text-xl font-medium
           cursor-pointer border-[0.5px] border-border transition-[background] duration-100
           relative"
    :class="{
      'text-given font-bold': isGiven,
      'text-input font-semibold': !isGiven && value !== 0 && !ownerColor,
      'font-semibold': !isGiven && value !== 0 && ownerColor,
      'bg-accent-dim shadow-[inset_0_0_0_2px_var(--accent)] z-1': isSelected,
      'bg-highlight': isHighlighted && !isSelected,
      'bg-error-dim text-error!': isError,
      'bg-accent-glow': isSameNumber && !isSelected,
    }"
    :style="ownerColor && !isGiven && !isError ? { color: ownerColor } : {}"
    @click="emit('select', row, col)"
  >
    <template v-if="isGiven || value !== 0">{{ value }}</template>
    <div
      v-else-if="notes && notes.size > 0"
      class="grid grid-cols-3 grid-rows-3 w-full h-full p-px
             text-text-muted leading-none font-medium font-mono text-[0.6rem]"
    >
      <span v-for="n in 9" :key="n" class="flex items-center justify-center">
        {{ notes.has(n) ? n : '' }}
      </span>
    </div>
    <div
      v-for="cursor in peerCursors"
      :key="cursor.peerId"
      class="absolute inset-px rounded-sm pointer-events-none border-2 opacity-60"
      :style="{ borderColor: cursor.color }"
      style="animation: peerPulse 2s ease infinite"
    />
  </div>
</template>

<style scoped>
.cell {
  width: var(--cell-size);
  height: var(--cell-size);
}
</style>
