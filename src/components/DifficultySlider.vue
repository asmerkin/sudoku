<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { DIFF_LABELS } from '../composables/useSudokuEngine.js'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'change'])

const sliderWrap = ref(null)
const isDragging = ref(false)
const currentIdx = ref(props.modelValue)

watch(() => props.modelValue, (v) => { currentIdx.value = v })

function getPosition(idx) {
  if (!sliderWrap.value) return { thumbLeft: 8, fillWidth: 0 }
  const railWidth = sliderWrap.value.offsetWidth - 16
  return {
    thumbLeft: 8 + (idx / 3) * railWidth,
    fillWidth: (idx / 3) * railWidth,
  }
}

function getIdxFromX(clientX) {
  if (!sliderWrap.value) return 0
  const rect = sliderWrap.value.getBoundingClientRect()
  return Math.round(Math.max(0, Math.min(1, (clientX - rect.left - 8) / (rect.width - 16))) * 3)
}

function onDragStart(e) {
  isDragging.value = true
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  currentIdx.value = getIdxFromX(clientX)
  emit('update:modelValue', currentIdx.value)
  e.preventDefault()
}

function onDragMove(e) {
  if (!isDragging.value) return
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  currentIdx.value = getIdxFromX(clientX)
  emit('update:modelValue', currentIdx.value)
}

function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  emit('change', currentIdx.value)
}

onMounted(() => {
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('touchmove', onDragMove, { passive: true })
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchend', onDragEnd)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchend', onDragEnd)
})
</script>

<template>
  <div class="flex flex-col items-center gap-0.5 transition-all duration-250">
    <div
      ref="sliderWrap"
      class="relative w-50 h-8 cursor-pointer touch-none"
      @mousedown="onDragStart"
      @touchstart.prevent="onDragStart"
    >
      <!-- Rail -->
      <div class="absolute top-1/2 left-2 right-2 h-1 bg-border rounded-sm -translate-y-1/2" />
      <!-- Fill -->
      <div
        class="absolute top-1/2 left-2 h-1 bg-accent rounded-sm -translate-y-1/2 slider-spring-width"
        :style="{ width: getPosition(currentIdx).fillWidth + 'px' }"
      />
      <!-- Stops -->
      <div class="absolute top-1/2 left-2 right-2 -translate-y-1/2 flex justify-between pointer-events-none">
        <div
          v-for="i in 4"
          :key="i"
          class="w-2 h-2 rounded-full border-2 transition-colors duration-300 relative z-1"
          :class="i - 1 <= currentIdx
            ? 'bg-accent border-accent'
            : 'bg-border border-(--bg)'"
        />
      </div>
      <!-- Thumb -->
      <div
        class="absolute top-1/2 w-4.5 h-4.5 rounded-full bg-accent -translate-x-1/2 -translate-y-1/2 z-3 slider-spring"
        :class="isDragging
          ? 'scale-115 shadow-[0_0_0_6px_var(--accent-dim),0_0_16px_var(--accent-glow),0_2px_8px_rgba(0,0,0,0.25)]'
          : 'shadow-[0_0_0_4px_var(--accent-dim),0_2px_6px_rgba(0,0,0,0.2)]'"
        :style="{ left: getPosition(currentIdx).thumbLeft + 'px' }"
      />
    </div>
    <!-- Labels -->
    <div class="flex justify-between w-50 px-0.5">
      <span
        v-for="(label, i) in DIFF_LABELS"
        :key="i"
        class="font-mono text-[0.5rem] uppercase tracking-wide transition-colors duration-300 w-12.5 text-center"
        :class="i === currentIdx ? 'text-accent font-semibold' : 'text-text-muted'"
      >
        {{ label }}
      </span>
    </div>
  </div>
</template>
