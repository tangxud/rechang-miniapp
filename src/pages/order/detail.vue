<template>
  <view class="detail-page">
    <view class="nav-bar"><text class="nav-back" @tap="goBack">‹</text><text class="nav-title">订单详情</text></view>
    <view v-if="loading" class="loading"><text>加载中...</text></view>
    <template v-if="order">
      <view class="status-banner" :class="bannerClass(order.status)">
        <text class="banner-title">{{ statusLabel(order.status) }}</text>
        <text class="banner-desc">{{ statusDesc(order.status) }}</text>
      </view>
      <scroll-view scroll-y class="content">
        <view class="card">
          <view class="perf-row">
            <image class="poster" :src="order.posterUrl || placeholder" mode="aspectFill" />
            <view class="perf-info">
              <text class="perf-name">{{ order.performanceName }}</text>
              <text class="perf-date">{{ formatDateTime(order.startAt) }}</text>
              <text class="perf-venue">{{ order.venueName }}</text>
            </view>
          </view>
        </view>
        <view class="card">
          <text class="card-title">票信息</text>
        <view v-for="t in order.tickets" :key="t.id" class="ticket-row">
          <view class="ticket-left">
            <text class="ticket-seat">{{ t.seatLabel }}</text>
            <text class="ticket-attendee">{{ t.attendeeName }}</text>
          </view>
          <text class="ticket-price">¥{{ formatPrice(t.faceAmount) }}</text>
          <text class="ticket-status" :class="statusColorClass(t.status)">{{ ticketStatusLabel(t.status) }}</text>
          <view v-if="t.status === 'USABLE'" class="ticket-qrcode" @tap.stop="goTicketQrcode(t)"><text>电子票</text></view>
          <view v-if="t.status === 'USABLE'" class="ticket-transfer" @tap.stop="onTransfer(t)"><text>转赠</text></view>
        </view>
        </view>
        <view class="card">
          <text class="card-title">订单信息</text>
          <view class="info-row"><text class="info-label">订单号</text><text class="info-value">{{ order.orderNo }}</text></view>
          <view class="info-row"><text class="info-label">下单时间</text><text class="info-value">{{ formatDateTime(order.createTime) }}</text></view>
          <view class="info-row"><text class="info-label">支付方式</text><text class="info-value">{{ payChannelText }}</text></view>
          <view class="info-row"><text class="info-label">订单金额</text><text class="info-value price">¥{{ formatPrice(order.totalAmount) }}</text></view>
        </view>
        <view v-if="order.timeline && order.timeline.length" class="card">
          <text class="card-title">状态时间线</text>
          <view v-for="(item, i) in order.timeline" :key="i" class="timeline-item">
            <view class="timeline-dot" :class="{ active: i === order.timeline.length - 1 }"></view>
            <view class="timeline-content">
              <text class="timeline-label">{{ item.label }}</text>
              <text class="timeline-time">{{ formatDateTime(item.time) }}</text>
            </view>
          </view>
        </view>
        <view class="bottom-placeholder"></view>
      </scroll-view>
      <view class="action-bar">
        <view v-if="order.status === 'ISSUED'" class="action-btn outline" @tap="goRefund"><text class="btn-text">退票</text></view>
        <view v-if="order.status === 'ATTENDED'" class="action-btn primary" @tap="goReview"><text class="btn-text">去评价</text></view>
        <view v-if="order.status === 'REVIEWED'" class="action-btn primary" @tap="goMyReview"><text class="btn-text">查看评价</text></view>
        <view v-if="order.status === 'PENDING_PAY'" class="action-btn primary" @tap="goPay(order)"><text class="btn-text">去支付</text></view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getOrderDetail } from '../../api/order'
import { startTransfer } from '../../api/ticket'

const placeholder = 'https://cdn.rechang.com/placeholder.jpg'
const orderId = ref(0)
const order = ref<any>(null)
const loading = ref(false)

const payChannelText = computed(() => {
  const ch = order.value?.payChannel
  if (ch === 'WECHAT') return '微信支付'
  if (ch === 'ALIPAY') return '支付宝'
  return ch || '—'
})
const usableTickets = computed(() => order.value?.tickets?.filter((t: any) => t.status === 'USABLE') || [])

onLoad((options: any) => {
  orderId.value = Number(options?.id || 0)
  if (orderId.value) loadDetail()
})

async function loadDetail() {
  loading.value = true
  try { order.value = await getOrderDetail(orderId.value) }
  catch (e) {} finally { loading.value = false }
}

function statusLabel(s: string) {
  const m: Record<string,string> = { PENDING_PAY:'待支付', ISSUED:'已出票', CANCELLED:'已取消', REFUNDED:'已退款', TRANSFERRED:'已转赠', ATTENDED:'已观演', REVIEWED:'已评价' }
  return m[s] || s
}
function statusDesc(s: string) {
  const m: Record<string,string> = { PENDING_PAY:'请尽快完成支付', ISSUED:'请凭电子票入场，强实名核验', CANCELLED:'订单已取消', REFUNDED:'退款已处理', ATTENDED:'感谢您的观看', REVIEWED:'已发表评价' }
  return m[s] || ''
}
function bannerClass(s: string) {
  if (s === 'PENDING_PAY') return 'banner-orange'
  if (s === 'ISSUED') return 'banner-dark'
  if (s === 'REVIEWED') return 'banner-green'
  return 'banner-gray'
}
function ticketStatusLabel(s: string) {
  const m: Record<string,string> = { USABLE:'可用', USED:'已使用', TRANSFERRED:'已转赠', REFUNDED:'已退票', EXPIRED:'已过期' }
  return m[s] || s
}
function statusColorClass(s: string) {
  if (s === 'USABLE') return 'status-usable'
  if (s === 'USED' || s === 'EXPIRED') return 'status-gray'
  if (s === 'TRANSFERRED' || s === 'REFUNDED') return 'status-warn'
  return ''
}
function formatPrice(c: number) { const y = c/100; return Number.isInteger(y)?y.toString():y.toFixed(2) }
function formatDateTime(d: string) { return d ? d.replace(/-/g,'.').replace('T',' ').substring(0,16) : '' }
function goBack() { uni.navigateBack() }
function goTickets() { uni.switchTab({ url: '/pages/tickets/index' }) }
function goRefund() { uni.navigateTo({ url: `/pages/order/refund?orderId=${orderId.value}` }) }
function goReview() {
  if (!order.value) return
  uni.navigateTo({ url: `/pages/review/post?perfId=${order.value.performanceId}&orderId=${orderId.value}` })
}
function goMyReview() {
  if (!order.value) return
  if (order.value.reviewId) {
    uni.navigateTo({ url: `/pages/review/detail?id=${order.value.reviewId}&perfId=${order.value.performanceId}` })
  } else {
    uni.navigateTo({ url: `/pages/review/list?id=${order.value.performanceId}` })
  }
}
function goTicketQrcode(t: any) { uni.navigateTo({ url: `/pages/tickets/qrcode?id=${t.id}&name=${encodeURIComponent(order.value?.performanceName || '')}` }) }
function goQrcode() { goTicketQrcode(usableTickets.value[0]) }
function goPay(order: any) { uni.navigateTo({ url: `/pages/order/pay?id=${order.id}&amount=${order.totalAmount}` }) }
function toastDev(msg: string) { uni.showToast({ title: msg, icon: 'none' }) }

async function onTransfer(t: any) {
  uni.showLoading({ title: '生成转赠链接...' })
  try {
    const res: any = await startTransfer(t.id)
    uni.hideLoading()
    const token = res?.transferToken || ''
    if (!token) { uni.showToast({ title: '生成失败', icon: 'none' }); return }
    showTransferModal(t, token)
  } catch (e) {
    uni.hideLoading()
  }
}

function showTransferModal(t: any, token: string) {
  // 小程序端直接传 token；H5 端拼完整跳转链接（条件编译，vue-tsc 只认 let 单声明写法）
  let shareUrl = token
  // #ifdef H5
  shareUrl = `${window.location.origin}/#/pages/review/transfer-claim?token=${token}`
  // #endif
  uni.showModal({
    title: '转赠成功',
    content: `转赠链接已生成，24 小时内有效。受赠人打开链接即可领取。`,
    confirmText: '复制链接',
    cancelText: '关闭',
    success: (res) => {
      if (res.confirm) {
        uni.setClipboardData({ data: shareUrl })
      }
    }
  })
}
</script>

<style scoped>
.detail-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.nav-bar { display: flex; align-items: center; gap: 16rpx; padding: 0 24rpx; height: 88rpx; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.nav-back { font-size: 48rpx; color: #222; }
.nav-title { font-size: 32rpx; font-weight: 600; color: #222; }
.loading { text-align: center; padding: 120rpx 0; font-size: 28rpx; color: #999; }
.status-banner { padding: 32rpx 24rpx; }
.banner-dark { background: #1a1d21; }
.banner-orange { background: #FF6B35; }
.banner-green { background: #4caf50; }
.banner-gray { background: #999; }
.banner-title { font-size: 36rpx; font-weight: 700; color: #fff; }
.banner-desc { font-size: 26rpx; color: rgba(255,255,255,0.7); display: block; margin-top: 8rpx; }
.content { flex: 1; }
.card { margin: 24rpx; padding: 24rpx; background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.perf-row { display: flex; gap: 16rpx; }
.poster { width: 96rpx; height: 128rpx; border-radius: 8rpx; background: #f0f0f0; flex-shrink: 0; }
.perf-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.perf-name { font-size: 28rpx; font-weight: 600; color: #222; }
.perf-date { font-size: 24rpx; color: #999; }
.perf-venue { font-size: 24rpx; color: #999; }
.card-title { font-size: 28rpx; font-weight: 600; color: #222; display: block; margin-bottom: 16rpx; }
.ticket-row { display: flex; align-items: center; gap: 16rpx; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.ticket-left { flex: 1; }
.ticket-seat { font-size: 26rpx; color: #333; display: block; }
.ticket-attendee { font-size: 22rpx; color: #999; }
.ticket-price { font-size: 26rpx; color: #FF6B35; font-weight: 600; }
.ticket-status { font-size: 22rpx; color: #4caf50; }
.ticket-status.status-usable { color: #4caf50; }
.ticket-status.status-warn { color: #FF6B35; }
.ticket-status.status-gray { color: #999; }
.ticket-qrcode { padding: 4rpx 12rpx; border: 1rpx solid #FF6B35; border-radius: 8rpx; }
.ticket-qrcode text { font-size: 20rpx; color: #FF6B35; }
.ticket-transfer { padding: 4rpx 12rpx; border: 1rpx solid #4caf50; border-radius: 8rpx; }
.ticket-transfer text { font-size: 20rpx; color: #4caf50; }
.info-row { display: flex; justify-content: space-between; padding: 12rpx 0; }
.info-label { font-size: 26rpx; color: #999; }
.info-value { font-size: 26rpx; color: #333; }
.info-value.price { color: #FF6B35; font-weight: 700; }
.timeline-item { display: flex; gap: 16rpx; padding: 12rpx 0; }
.timeline-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #ddd; margin-top: 8rpx; flex-shrink: 0; }
.timeline-dot.active { background: #FF6B35; }
.timeline-content { flex: 1; }
.timeline-label { font-size: 26rpx; color: #333; display: block; }
.timeline-time { font-size: 22rpx; color: #999; }
.bottom-placeholder { height: 140rpx; }
.action-bar { display: flex; gap: 16rpx; padding: 16rpx 24rpx; background: #fff; border-top: 1rpx solid #eef0f3; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); }
.action-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; }
.action-btn.outline { border: 2rpx solid #e0e0e0; }
.action-btn.primary { background: linear-gradient(135deg, #FF6B35, #FF3B3B); }
.btn-text { font-size: 28rpx; font-weight: 600; }
.outline .btn-text { color: #666; }
.primary .btn-text { color: #fff; }
</style>
