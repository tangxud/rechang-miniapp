<template>
  <view class="claim-page">
    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <view v-if="preview && !claimed" class="card">
      <image v-if="preview.poster_url" class="poster" :src="preview.poster_url" mode="aspectFill" />
      <view v-else class="poster placeholder"><text class="poster-text">🎫</text></view>

      <view class="info-block">
        <text class="perf-name">{{ preview.perf_name }}</text>
        <text class="info-line">📅 {{ formatDateTime(preview.start_at) }}</text>
        <text v-if="preview.venue_name" class="info-line">📍 {{ preview.venue_name }}</text>
        <text class="info-line">🎟️ {{ preview.seat_label }}</text>
        <text class="info-line amount">票面金额 ¥{{ formatPrice(preview.face_amount) }}</text>
      </view>

      <view class="giver-row">
        <text class="giver-text">{{ preview.giver_nickname }} 送你一张演出票</text>
        <text class="expire-text">链接 24 小时内有效</text>
      </view>

      <view class="action-area">
        <template v-if="userStore.isLoggedIn">
          <view class="claim-btn" @tap="onClaim" :class="{ disabled: claiming }">
            <text class="claim-btn-text">{{ claiming ? '领取中...' : '确认领取' }}</text>
          </view>
          <text class="claim-tip">领取后需实名认证，且同一场次限购校验通过方可领取</text>
        </template>
        <template v-else>
          <view class="claim-btn" @tap="goLogin"><text class="claim-btn-text">登录后领取</text></view>
        </template>
      </view>
    </view>

    <view v-if="claimed" class="card success-card">
      <text class="success-icon">✅</text>
      <text class="success-title">领取成功</text>
      <text class="success-desc">票已放入你的票夹，可凭电子票入场</text>
      <view class="success-actions">
        <view class="ok-btn" @tap="goTickets"><text class="ok-btn-text">查看票夹</text></view>
        <view class="ok-btn ghost" @tap="goHome"><text class="ok-btn-text">返回首页</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { previewTransfer, claimTransfer } from '../../api/ticket'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const token = ref('')
const preview = ref<any>(null)
const loading = ref(true)
const claiming = ref(false)
const claimed = ref(false)

onLoad((options: any) => {
  userStore.restoreFromStorage()
  token.value = options?.token || options?.transferToken || ''
  if (token.value) loadPreview()
  else { loading.value = false }
})

async function loadPreview() {
  try {
    const data: any = await previewTransfer(token.value)
    preview.value = data
  } catch (e) {
    preview.value = null
  } finally {
    loading.value = false
  }
}

async function onClaim() {
  if (claiming.value) return
  claiming.value = true
  try {
    await claimTransfer(token.value)
    claimed.value = true
  } catch (e) {
    // 错误已由 request 处理
  } finally {
    claiming.value = false
  }
}

function goLogin() { uni.navigateTo({ url: '/pages/profile/login' }) }
function goTickets() { uni.switchTab({ url: '/pages/tickets/index' }) }
function goHome() { uni.switchTab({ url: '/pages/home/index' }) }

function formatDateTime(d: string) {
  if (!d) return '待定'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  const hh = String(dt.getHours()).padStart(2, '0')
  const mm = String(dt.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}`
}
function formatPrice(cents: number) {
  if (cents == null) return '待定'
  const y = cents / 100
  return Number.isInteger(y) ? y.toString() : y.toFixed(2)
}
</script>

<style scoped>
.claim-page { min-height: 100vh; background: #f5f5f5; padding: 24rpx; }
.loading { text-align: center; padding: 200rpx 0; font-size: 28rpx; color: #999; }

.card { background: #fff; border-radius: 16rpx; overflow: hidden; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08); }
.poster { width: 100%; height: 400rpx; background: #f0f0f0; }
.placeholder { display: flex; align-items: center; justify-content: center; }
.poster-text { font-size: 120rpx; }

.info-block { padding: 28rpx; }
.perf-name { font-size: 34rpx; font-weight: 700; color: #222; display: block; margin-bottom: 16rpx; }
.info-line { font-size: 26rpx; color: #666; display: block; padding: 6rpx 0; }
.info-line.amount { color: #FF6B35; font-weight: 600; }

.giver-row { padding: 24rpx 28rpx; background: #fff8f4; border-top: 1rpx solid #f5e6dd; }
.giver-text { font-size: 28rpx; color: #FF6B35; font-weight: 600; display: block; }
.expire-text { font-size: 22rpx; color: #999; display: block; margin-top: 8rpx; }

.action-area { padding: 28rpx; }
.claim-btn { height: 88rpx; background: linear-gradient(135deg, #FF6B35, #FF3B3B); border-radius: 44rpx; display: flex; align-items: center; justify-content: center; }
.claim-btn.disabled { opacity: 0.6; }
.claim-btn-text { font-size: 30rpx; color: #fff; font-weight: 700; }
.claim-tip { font-size: 22rpx; color: #999; display: block; text-align: center; margin-top: 16rpx; }

.success-card { padding: 60rpx 40rpx; display: flex; flex-direction: column; align-items: center; }
.success-icon { font-size: 100rpx; margin-bottom: 24rpx; }
.success-title { font-size: 36rpx; font-weight: 700; color: #222; }
.success-desc { font-size: 26rpx; color: #999; margin-top: 16rpx; }
.success-actions { display: flex; gap: 24rpx; margin-top: 48rpx; width: 100%; }
.ok-btn { flex: 1; height: 84rpx; background: linear-gradient(135deg, #FF6B35, #FF3B3B); border-radius: 42rpx; display: flex; align-items: center; justify-content: center; }
.ok-btn.ghost { background: #fff; border: 2rpx solid #e0e0e0; }
.ok-btn-text { font-size: 28rpx; color: #fff; font-weight: 600; }
.ok-btn.ghost .ok-btn-text { color: #666; }
</style>
