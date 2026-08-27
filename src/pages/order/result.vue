<template>
  <view class="result-page">
    <view class="result-icon" :class="{ success: isSuccess, fail: !isSuccess }">
      <text class="icon-text">{{ isSuccess ? '✓' : '✕' }}</text>
    </view>
    <text class="result-title">{{ isSuccess ? '支付成功' : '支付失败' }}</text>
    <text v-if="isSuccess" class="result-desc">已出票，电子票已发送至票夹</text>
    <text v-else class="result-desc">{{ errorMsg || '请稍后重试' }}</text>

    <view v-if="order" class="order-card">
      <view class="order-row"><text class="order-label">订单号</text><text class="order-value">{{ order.order_no }}</text></view>
      <view class="order-row"><text class="order-label">支付方式</text><text class="order-value">{{ payChannelText }}</text></view>
      <view class="order-row"><text class="order-label">订单金额</text><text class="order-value">¥{{ formatPrice(order.total_amount) }}</text></view>
    </view>

    <view class="note-blue">📱 入场时请在票夹出示电子票二维码</view>

    <view class="action-bar">
      <view class="action-btn outline" @tap="goHome"><text class="btn-text">返回首页</text></view>
      <view class="action-btn primary" @tap="goTickets"><text class="btn-text">查看票夹</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getOrderDetail } from '../../api/order'

const orderId = ref(0)
const order = ref<any>(null)
const isSuccess = ref(true)
const errorMsg = ref('')

const payChannelText = computed(() => {
  const ch = order.value?.pay_channel
  if (ch === 'WECHAT') return '微信支付'
  if (ch === 'ALIPAY') return '支付宝'
  return ch || '微信支付'
})

onLoad(async (options: any) => {
  orderId.value = Number(options?.id || 0)
  if (orderId.value) {
    try {
      order.value = await getOrderDetail(orderId.value)
      isSuccess.value = order.value?.status === 'ISSUED'
    } catch (e) {
      isSuccess.value = false
      errorMsg.value = '获取订单信息失败'
    }
  }
})

function formatPrice(cents: number) { const y = cents / 100; return Number.isInteger(y) ? y.toString() : y.toFixed(2) }
function goHome() { uni.switchTab({ url: '/pages/home/index' }) }
function goTickets() { uni.switchTab({ url: '/pages/tickets/index' }) }
</script>

<style scoped>
.result-page { min-height: 100vh; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; padding: 80rpx 48rpx; }
.result-icon { width: 120rpx; height: 120rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 32rpx; }
.result-icon.success { background: #dcfce7; }
.result-icon.fail { background: #fee2e2; }
.icon-text { font-size: 64rpx; font-weight: 700; }
.success .icon-text { color: #22c55e; }
.fail .icon-text { color: #ef4444; }
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
