<template>
  <view class="pay-page">
    <view class="nav-bar"><text class="nav-back" @tap="goBack">‹</text><text class="nav-title">收银台</text></view>
    <view class="amount-section">
      <text class="amount-label">需支付</text>
      <text class="amount-value">¥{{ formatPrice(amount) }}.00</text>
      <view class="countdown" v-if="countdown > 0">
        <text class="countdown-text">⏰ 剩余 {{ Math.floor(countdown/60) }}:{{ String(countdown%60).padStart(2,'0') }}</text>
      </view>
    </view>
    <view class="pay-methods">
      <view class="method-item selected">
        <text class="method-icon">💚</text>
        <view class="method-info"><text class="method-name">微信支付</text><text class="method-tag">推荐</text></view>
        <view class="method-check checked"></view>
      </view>
      <view class="method-item disabled">
        <text class="method-icon">💙</text>
        <view class="method-info"><text class="method-name">支付宝</text><text class="method-tag">敬请期待</text></view>
      </view>
      <view class="method-item disabled">
        <text class="method-icon">💳</text>
        <view class="method-info"><text class="method-name">银联</text><text class="method-tag">敬请期待</text></view>
      </view>
    </view>
    <view class="pay-tip">
      <text class="pay-tip-text">支付即同意《热场服务协议》</text>
    </view>
    <view class="action-bar">
      <view class="pay-btn" :class="{ disabled: paying }" @tap="onPay">
        <text class="pay-btn-text">{{ paying ? '支付中...' : `确认支付 ¥${formatPrice(amount)}` }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { payOrder } from '../../api/order'

const orderId = ref(0)
const amount = ref(0)
const countdown = ref(900)
const paying = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

onLoad((options: any) => {
  orderId.value = Number(options?.id || 0)
  amount.value = Number(options?.amount || 0)
  timer = setInterval(() => { if (countdown.value > 0) countdown.value-- }, 1000)
})

onUnmounted(() => { if (timer) clearInterval(timer) })

async function onPay() {
  if (paying.value) return
  paying.value = true
  try {
    await payOrder(orderId.value)
    uni.redirectTo({ url: `/pages/order/result?id=${orderId.value}` })
  } catch (e) {} finally { paying.value = false }
}

function formatPrice(cents: number) { return String(cents / 100) }
function goBack() { uni.navigateBack() }
</script>

<style scoped>
.pay-page { min-height: 100vh; background: #f5f5f5; }
.nav-bar { display: flex; align-items: center; gap: 16rpx; padding: 0 24rpx; height: 88rpx; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.nav-back { font-size: 48rpx; color: #222; }
.nav-title { font-size: 32rpx; font-weight: 600; color: #222; }
.amount-section { text-align: center; padding: 48rpx 0 32rpx; background: #fff; }
.amount-label { font-size: 26rpx; color: #999; }
.amount-value { font-size: 72rpx; font-weight: 700; color: #222; display: block; margin-top: 8rpx; }
.countdown { margin-top: 16rpx; }
.countdown-text { font-size: 24rpx; color: #999; }
.pay-methods { margin: 24rpx; background: #fff; border-radius: 16rpx; overflow: hidden; }
.method-item { display: flex; align-items: center; gap: 16rpx; padding: 28rpx 24rpx; border-bottom: 1rpx solid #f5f5f5; }
.method-item:last-child { border-bottom: none; }
.method-item.disabled { opacity: 0.5; }
.method-item.selected { background: #f0f7ff; }
.method-icon { font-size: 40rpx; }
.method-info { flex: 1; }
.method-name { font-size: 28rpx; color: #333; }
.method-tag { font-size: 20rpx; color: #999; margin-left: 8rpx; }
.method-check { width: 36rpx; height: 36rpx; border: 2rpx solid #ddd; border-radius: 50%; }
.method-check.checked { background: #07c160; border-color: #07c160; }
.method-check.checked::after { content: '✓'; color: #fff; font-size: 20rpx; display: flex; align-items: center; justify-content: center; height: 100%; }
.pay-tip { text-align: center; padding: 16rpx 24rpx; }
.pay-tip-text { font-size: 22rpx; color: #999; }
.action-bar { position: fixed; bottom: 0; left: 0; width: 100%; padding: 16rpx 24rpx; background: #fff; border-top: 1rpx solid #eef0f3; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); }
.pay-btn { height: 88rpx; background: linear-gradient(135deg, #07c160, #06ad56); border-radius: 44rpx; display: flex; align-items: center; justify-content: center; }
.pay-btn.disabled { opacity: 0.6; }
.pay-btn-text { font-size: 32rpx; font-weight: 600; color: #fff; }
</style>
