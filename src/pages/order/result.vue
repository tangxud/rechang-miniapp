<template>
  <view class="result-page">
    <view class="result-icon" :class="payState">
      <text class="icon-text">{{ stateIcon }}</text>
    </view>
    <text class="result-title">{{ stateTitle }}</text>
    <text class="result-desc">{{ stateDesc }}</text>

    <view v-if="order" class="order-card">
      <view class="order-row"><text class="order-label">订单号</text><text class="order-value">{{ order.orderNo }}</text></view>
      <view class="order-row"><text class="order-label">支付方式</text><text class="order-value">{{ payChannelText }}</text></view>
      <view class="order-row"><text class="order-label">订单金额</text><text class="order-value">¥{{ formatPrice(order.totalAmount) }}</text></view>
    </view>

    <view v-if="payState === 'success'" class="note-blue">📱 入场时请在票夹出示电子票二维码</view>

    <view class="action-bar">
      <view class="action-btn outline" @tap="goHome"><text class="btn-text">返回首页</text></view>
      <view v-if="payState === 'success'" class="action-btn primary" @tap="goTickets"><text class="btn-text">查看票夹</text></view>
      <view v-else-if="payState === 'fail'" class="action-btn primary" @tap="retryPay"><text class="btn-text">重新支付</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getOrderDetail, getPayStatus } from '../../api/order'

const orderId = ref(0)
const order = ref<any>(null)
const payState = ref<'success' | 'pending' | 'fail'>('pending')
const errorMsg = ref('')

// 回调有延迟：requestPayment 成功后轮询确认，最多 15 次 × 2s
const POLL_INTERVAL = 2000
const MAX_POLL = 15
let pollCount = 0
let pollTimer: ReturnType<typeof setTimeout> | null = null

const stateIcon = computed(() => (payState.value === 'success' ? '✓' : payState.value === 'pending' ? '⏳' : '✕'))
const stateTitle = computed(() => ({ success: '支付成功', pending: '支付确认中', fail: '支付失败' }[payState.value]))
const stateDesc = computed(() => {
  if (payState.value === 'success') return '已出票，电子票已发送至票夹'
  if (payState.value === 'pending') return '正在确认支付结果，请稍候…'
  return errorMsg.value || '支付未完成，请稍后在订单中查看'
})

const payChannelText = computed(() => {
  const ch = order.value?.payChannel
  if (ch === 'WECHAT') return '微信支付'
  if (ch === 'ALIPAY') return '支付宝'
  return ch || '微信支付'
})

onLoad((options: any) => {
  orderId.value = Number(options?.id || 0)
  if (orderId.value) {
    pollPayStatus()
  } else {
    payState.value = 'fail'
    errorMsg.value = '订单信息缺失'
  }
})

onUnmounted(() => { if (pollTimer) clearTimeout(pollTimer) })

async function pollPayStatus() {
  try {
    const st = await getPayStatus(orderId.value)
    if (st.paid) {
      payState.value = 'success'
      await loadOrder()
      return
    }
  } catch (e) { /* 网络抖动等下一轮重试 */ }
  pollCount++
  if (pollCount >= MAX_POLL) {
    await finalize()
    return
  }
  pollTimer = setTimeout(pollPayStatus, POLL_INTERVAL)
}

/** 轮询窗口耗尽后以订单终态裁决（真实网关下长于 30s 的回调极为罕见） */
async function finalize() {
  try {
    await loadOrder()
    const s = order.value?.status
    if (s === 'ISSUED') { payState.value = 'success'; return }
    if (s === 'CANCELLED') { errorMsg.value = '订单已超时取消' }
    else { errorMsg.value = '支付确认超时，请稍后在订单中查看结果' }
    payState.value = 'fail'
  } catch (e) {
    payState.value = 'fail'
    errorMsg.value = '获取订单信息失败'
  }
}

async function loadOrder() { order.value = await getOrderDetail(orderId.value) }

function retryPay() {
  const amt = order.value?.totalAmount || 0
  uni.redirectTo({ url: `/pages/order/pay?id=${orderId.value}&amount=${amt}` })
}

function formatPrice(cents: number) { const y = cents / 100; return Number.isInteger(y) ? y.toString() : y.toFixed(2) }
function goHome() { uni.switchTab({ url: '/pages/home/index' }) }
function goTickets() { uni.switchTab({ url: '/pages/tickets/index' }) }
</script>

<style scoped>
.result-page { min-height: 100vh; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; padding: 80rpx 48rpx; }
.result-icon { width: 120rpx; height: 120rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 32rpx; }
.result-icon.success { background: #dcfce7; }
.result-icon.fail { background: #fee2e2; }
.result-icon.pending { background: #fef9c3; }
.icon-text { font-size: 64rpx; font-weight: 700; }
.success .icon-text { color: #22c55e; }
.fail .icon-text { color: #ef4444; }
.pending .icon-text { color: #eab308; }
.result-title { font-size: 40rpx; font-weight: 700; color: #222; }
.result-desc { font-size: 28rpx; color: #999; margin-top: 12rpx; text-align: center; }
.order-card { width: 100%; margin: 40rpx 0; padding: 32rpx; background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.order-row { display: flex; justify-content: space-between; padding: 12rpx 0; }
.order-label { font-size: 26rpx; color: #999; }
.order-value { font-size: 26rpx; color: #333; }
.note-blue { font-size: 22rpx; color: #3b82f6; text-align: center; }
.action-bar { display: flex; gap: 24rpx; margin-top: 48rpx; width: 100%; }
.action-btn { flex: 1; height: 88rpx; border-radius: 44rpx; display: flex; align-items: center; justify-content: center; }
.action-btn.outline { border: 2rpx solid #ddd; }
.action-btn.primary { background: linear-gradient(135deg, #FF6B35, #FF3B3B); }
.btn-text { font-size: 30rpx; font-weight: 600; }
.outline .btn-text { color: #666; }
.primary .btn-text { color: #fff; }
</style>
