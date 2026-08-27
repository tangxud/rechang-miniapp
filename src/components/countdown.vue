<template>
  <view class="countdown">
    <text class="cd-text">{{ display }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{ seconds: number }>()

const remaining = ref(Math.max(0, Math.floor(props.seconds)))
let timer: ReturnType<typeof setInterval> | null = null

watch(() => props.seconds, (v) => {
  remaining.value = Math.max(0, Math.floor(v))
})

function pad(n: number) {
  return String(n).padStart(2, '0')
}

const display = computed(() => {
  const s = remaining.value
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  if (days >= 1) {
    return `${days}天${pad(hours)}时${pad(minutes)}分`
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
})

onMounted(() => {
  timer = setInterval(() => {
    if (remaining.value > 0) remaining.value--
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.countdown {
  display: inline-flex;
  align-items: center;
}
.cd-text {
  font-size: 24rpx;
  color: #FF6B35;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
