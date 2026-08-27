<template>
  <view class="order-list-page">
    <view class="nav-bar"><text class="nav-back" @tap="goBack">‹</text><text class="nav-title">我的订单</text></view>
    <scroll-view scroll-x class="status-tabs" :show-scrollbar="false">
      <view class="tabs-inner">
        <text
          v-for="tab in tabs" :key="tab.key"
          class="tab-item" :class="{ active: activeStatus === tab.key }"
          @tap="switchTab(tab.key)"
        >{{ tab.label }}</text>
      </view>
    </scroll-view>
    <scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
      <view v-if="loading && list.length === 0" class="loading"><text>加载中...</text></view>
      <view v-else-if="list.length === 0" class="empty"><EmptyState text="暂无订单" icon="📋" /></view>
      <view v-else class="order-cards">
        <view v-for="order in list" :key="order.id" class="order-card" @tap="goDetail(order.id)">
          <view class="card-top">
            <image class="poster" :src="order.posterUrl || placeholder" mode="aspectFill" />
            <view class="info">
              <text class="perf-name">{{ order.performanceName }}</text>
              <text class="order-no">{{ order.orderNo }}</text>
              <text class="order-date">{{ formatDate(order.createTime) }}</text>
            </view>
            <text class="status-tag" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</text>
          </view>
          <view class="card-bottom">
            <text class="amount">¥{{ formatPrice(order.totalAmount) }}</text>
            <view class="actions">
              <text v-if="order.status === 'PENDING_PAY'" class="action-text cancel" @tap.stop="onCancel(order)">取消</text>
              <text v-if="order.status === 'PENDING_PAY'" class="action-text pay" @tap.stop="goPay(order)">去支付</text>
              <text v-if="order.status === 'ISSUED'" class="action-text" @tap.stop="goTickets">查看票夹</text>
              <text v-if="order.status === 'ATTENDED'" class="action-text" @tap.stop="toastDev('评价功能开发中')">去评价</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getOrderList, cancelOrder } from '../../api/order'
import EmptyState from '../../components/empty-state.vue'

const placeholder = 'https://cdn.rechang.com/placeholder.jpg'

const tabs = [
  { key: '', label: '全部' },
  { key: 'PENDING_PAY', label: '待支付' },
  { key: 'ISSUED', label: '已出票' },
  { key: 'ATTENDED', label: '已观演' },
  { key: 'REVIEWED', label: '已评价' },
  { key: 'CANCELLED', label: '已取消' }
]
const activeStatus = ref('')
const list = ref<any[]>([])
const loading = ref(false)

onShow(() => { loadList() })

async function loadList() {
  loading.value = true
  try {
    const data: any = await getOrderList(activeStatus.value || undefined)
    list.value = Array.isArray(data) ? data : (data?.list || [])
  } catch (e) {} finally { loading.value = false }
}

function switchTab(key: string) { activeStatus.value = key; loadList() }
function loadMore() { /* TODO: pagination */ }

function statusLabel(s: string) {
  const m: Record<string,string> = { PENDING_PAY:'待支付', ISSUED:'已出票', CANCELLED:'已取消', REFUNDED:'已退款', TRANSFERRED:'已转赠', ATTENDED:'已观演', REVIEWED:'已评价' }
  return m[s] || s
}
function statusClass(s: string) {
  if (s === 'PENDING_PAY') return 'st-orange'
  if (s === 'ISSUED') return 'st-green'
  if (s === 'CANCELLED' || s === 'REFUNDED') return 'st-gray'
  return 'st-blue'
}
function formatPrice(c: number) { const y = c/100; return Number.isInteger(y)?y.toString():y.toFixed(2) }
function formatDate(d: string) { return d ? d.substring(0,10) : '' }

function goDetail(id: number) { uni.navigateTo({ url: `/pages/order/detail?id=${id}` }) }
function goPay(order: any) { uni.navigateTo({ url: `/pages/order/pay?id=${order.id}&amount=${order.totalAmount}` }) }
function goTickets() { uni.switchTab({ url: '/pages/tickets/index' }) }
function goBack() { uni.navigateBack() }
function toastDev(msg: string) { uni.showToast({ title: msg, icon: 'none' }) }

async function onCancel(order: any) {
  uni.showModal({
    title: '提示', content: '确定取消该订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelOrder(order.id)
          uni.showToast({ title: '已取消', icon: 'success' })
          loadList()
        } catch (e) {}
      }
    }
  })
}
</script>

<style scoped>
.order-list-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.nav-bar { display: flex; align-items: center; gap: 16rpx; padding: 0 24rpx; height: 88rpx; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.nav-back { font-size: 48rpx; color: #222; }
.nav-title { font-size: 32rpx; font-weight: 600; color: #222; }
.status-tabs { white-space: nowrap; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.tabs-inner { display: inline-flex; gap: 8rpx; padding: 16rpx 24rpx; }
.tab-item { font-size: 26rpx; color: #999; padding: 8rpx 24rpx; border-radius: 24rpx; background: #f5f5f5; flex-shrink: 0; }
.tab-item.active { background: #FF6B35; color: #fff; }
.list-scroll { flex: 1; }
.loading { text-align: center; padding: 120rpx 0; font-size: 28rpx; color: #999; }
.order-cards { padding: 24rpx; }
.order-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.card-top { display: flex; gap: 16rpx; align-items: flex-start; }
.poster { width: 96rpx; height: 128rpx; border-radius: 8rpx; background: #f0f0f0; flex-shrink: 0; }
.info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; overflow: hidden; }
.perf-name { font-size: 28rpx; font-weight: 600; color: #222; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-no { font-size: 22rpx; color: #999; }
.order-date { font-size: 22rpx; color: #999; }
.status-tag { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 8rpx; flex-shrink: 0; }
.st-green { background: #e8f5e9; color: #4caf50; }
.st-orange { background: #fff3e0; color: #ff9800; }
.st-gray { background: #f0f0f0; color: #999; }
.st-blue { background: #e3f2fd; color: #2196f3; }
.card-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f5f5f5; }
.amount { font-size: 30rpx; font-weight: 700; color: #FF6B35; }
.actions { display: flex; gap: 16rpx; }
.action-text { font-size: 26rpx; color: #666; padding: 8rpx 24rpx; border: 1rpx solid #e0e0e0; border-radius: 24rpx; }
.action-text.pay { background: #FF6B35; color: #fff; border-color: #FF6B35; }
.action-text.cancel { color: #999; }
</style>
