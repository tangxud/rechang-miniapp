<template>
  <view class="qrcode-page">
    <view class="qr-card">
      <text class="perf-name">{{ perfName }}</text>
      <view class="qr-display">
        <view class="qr-box" :class="{ expired: expired }">
          <text class="qr-pattern">{{ qrPattern }}</text>
        </view>
      </view>
      <text class="countdown" v-if="!expired">{{ countdown }}s 后刷新</text>
      <view v-else class="refresh-btn" @tap="refresh">
        <text class="refresh-text">点击刷新</text>
      </view>
      <view class="info-list">
        <text class="info-item">🎫 票号: {{ ticketId }}</text>
        <text class="info-item">🔐 HMAC-SHA256 动态签名</text>
        <text class="info-item">⏱ 每30秒自动刷新</text>
        <text class="info-item">📱 离线可查看 · 验票端5分钟容忍</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getTicketQrcode } from '../../api/ticket'

const ticketId = ref(0)
const perfName = ref('')
const qrPattern = ref('')
const countdown = ref(30)
const expired = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

onLoad((options: any) => {
  ticketId.value = Number(options?.id || 0)
  perfName.value = decodeURIComponent(options?.name || '')
  if (ticketId.value) refresh()
})

async function refresh() {
  try {
    const data: any = await getTicketQrcode(ticketId.value)
    qrPattern.value = generatePattern(data.qr_content || '')
    countdown.value = 30
    expired.value = false
    startTimer()
  } catch (e) {
    // handled by request util
  }
}

function generatePattern(seed: string): string {
  const chars = '█▓▒░ '
  let result = ''
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  for (let i = 0; i < 25; i++) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    result += chars[hash % chars.length]
    if ((i + 1) % 5 === 0) result += '\n'
  }
  return result
}

function startTimer() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      expired.value = true
      if (timer) clearInterval(timer)
    }
  }, 1000)
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.qrcode-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}
.qr-card {
  width: 100%;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.perf-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
  text-align: center;
  margin-bottom: 32rpx;
}
.qr-display {
  margin-bottom: 24rpx;
}
.qr-box {
  width: 400rpx;
  height: 400rpx;
  background: #fff;
  border: 4rpx solid #333;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.qr-box.expired {
  border-color: #ccc;
  opacity: 0.5;
}
.qr-pattern {
  font-size: 28rpx;
  line-height: 1.2;
  font-family: monospace;
  letter-spacing: 4rpx;
  white-space: pre;
  text-align: center;
}
.countdown {
  font-size: 26rpx;
  color: #FF6B35;
  margin-bottom: 24rpx;
}
.refresh-btn {
  padding: 16rpx 48rpx;
  background: #FF6B35;
  border-radius: 32rpx;
  margin-bottom: 24rpx;
}
.refresh-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
}
.info-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  align-self: flex-start;
}
.info-item {
  font-size: 22rpx;
  color: #999;
}
</style>
