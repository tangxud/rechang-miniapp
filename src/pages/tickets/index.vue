<template>
  <view class="tickets">
    <view v-if="!userStore.isLoggedIn" class="login-prompt">
      <text class="login-icon">🎫</text>
      <text class="login-text">请先登录后查看票夹</text>
      <view class="login-btn" @tap="goLogin">
        <text class="login-btn-text">去登录</text>
      </view>
    </view>

    <template v-else>
      <view class="segment">
        <view
          v-for="tab in tabs" :key="tab.key"
          class="seg-item" :class="{ active: activeTab === tab.key }"
          @tap="switchTab(tab.key)"
        >{{ tab.label }}{{ tab.count != null ? ` (${tab.count})` : '' }}</view>
      </view>

      <scroll-view scroll-y class="ticket-list">
        <view v-if="loading && list.length === 0" class="loading"><text>加载中...</text></view>
        <view v-else-if="list.length === 0" class="empty-wrap"><EmptyState :text="emptyText" icon="🎫" /></view>

        <view v-else class="ticket-cards">
          <view v-for="item in list" :key="item.id" class="ticket-card" :class="ticketTheme(item.status)">
            <!-- 左侧色带 -->
            <view class="left-band"></view>

            <!-- 上半部分：演出信息 -->
            <view class="ticket-top">
              <view class="perf-header">
                <text class="perf-name">{{ item.performanceName }}</text>
                <text class="perf-type">{{ getTypeLabel(item) }}</text>
              </view>
              <view class="info-grid">
                <view class="info-cell">
                  <text class="cell-label">日期</text>
                  <text class="cell-value">{{ formatDate(item.startAt) }}</text>
                </view>
                <view class="info-cell">
                  <text class="cell-label">时间</text>
                  <text class="cell-value">{{ formatTime(item.startAt) }}</text>
                </view>
                <view class="info-cell">
                  <text class="cell-label">场馆</text>
                  <text class="cell-value">{{ item.venueName }}</text>
                </view>
                <view class="info-cell">
                  <text class="cell-label">座位</text>
                  <text class="cell-value seat-value">{{ item.seatLabel }}</text>
                </view>
              </view>
            </view>

            <!-- 撕齿分割线 -->
            <view class="tear-line">
              <view class="tear-circle left"></view>
              <view class="tear-dash"></view>
              <view class="tear-circle right"></view>
            </view>

            <!-- 下半部分：二维码+操作 -->
            <view class="ticket-bottom">
              <view class="bottom-left">
                <view class="amount-row">
                  <text class="amount-label">票面金额</text>
                  <text class="amount-value">¥{{ formatPrice(item.faceAmount) }}</text>
                </view>
                <text v-if="item.zoneName" class="zone-tag">{{ item.zoneName }}</text>
                <view v-if="item.attendeeIdCardMasked" class="attendee-row">
                  <text class="attendee-label">实名</text>
                  <text class="attendee-value">{{ item.attendeeIdCardMasked }}</text>
                </view>
              </view>
              <view class="bottom-right">
                <view v-if="item.status === 'USABLE'" class="qr-box" @tap="showQrcode(item)">
                  <view class="qr-pattern-mini">
                    <text class="qr-mini-text">扫码入场</text>
                  </view>
                  <text class="qr-label">点击查看二维码</text>
                </view>
                <view v-else class="status-stamp">
                  <text class="stamp-text">{{ stampText(item.status) }}</text>
                </view>
              </view>
            </view>

            <!-- 底部操作栏 -->
            <view v-if="item.status === 'USABLE'" class="ticket-actions">
              <view class="t-action" @tap="onTransfer(item)"><text class="t-action-text">📤 转赠</text></view>
              <view class="t-action-divider"></view>
              <view class="t-action" @tap="goDetail(item)"><text class="t-action-text">📋 演出详情</text></view>
            </view>
            <view v-if="item.status === 'USED' && canReview(item)" class="ticket-actions">
              <view class="t-action" @tap="goReview(item)"><text class="t-action-text">✍️ 去评价</text></view>
              <view class="t-action-divider"></view>
              <view class="t-action" @tap="goDetail(item)"><text class="t-action-text">📋 演出详情</text></view>
            </view>
            <view v-if="item.status === 'USED' && item.orderStatus === 'REVIEWED'" class="ticket-actions">
              <view class="t-action" @tap="goMyReview(item)"><text class="t-action-text">📖 查看评价</text></view>
              <view class="t-action-divider"></view>
              <view class="t-action" @tap="goDetail(item)"><text class="t-action-text">📋 演出详情</text></view>
            </view>
          </view>
        </view>
      </scroll-view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getTicketList, startTransfer } from '../../api/ticket'
import { useUserStore } from '../../stores/user'
import EmptyState from '../../components/empty-state.vue'

const placeholder = 'https://cdn.rechang.com/placeholder.jpg'
const userStore = useUserStore()

const tabs = ref([
  { key: 'USABLE', label: '未使用', count: null as number | null },
  { key: 'USED', label: '已使用', count: null as number | null },
  { key: 'EXPIRED', label: '已过期', count: null as number | null }
])
const activeTab = ref('USABLE')
const list = ref<any[]>([])
const loading = ref(false)

const emptyText = computed(() => {
  const m: Record<string, string> = { USABLE: '暂无可用电子票', USED: '暂无已使用的票', EXPIRED: '暂无已过期的票' }
  return m[activeTab.value] || '暂无票'
})

onShow(() => {
  if (!userStore.isLoggedIn) userStore.restoreFromStorage()
  if (userStore.isLoggedIn) loadList()
})

async function loadList() {
  loading.value = true
  try {
    const data: any = await getTicketList(activeTab.value)
    list.value = Array.isArray(data) ? data : (data?.list || [])
    const tab = tabs.value.find(t => t.key === activeTab.value)
    if (tab) tab.count = list.value.length
  } catch (e) {} finally { loading.value = false }
}

function switchTab(key: string) { activeTab.value = key; loadList() }

function formatDate(d: string) { if (!d) return '待定'; return d.substring(0, 10).replace(/-/g, '.') }
function formatTime(d: string) { if (!d) return '待定'; return d.substring(11, 16) }
function formatPrice(cents: number) { const y = cents / 100; return Number.isInteger(y) ? y.toString() : y.toFixed(2) }
function getTypeLabel(item: any) { return '演出票' }

function ticketTheme(status: string) {
  if (status === 'USABLE') return 'theme-active'
  if (status === 'USED') return 'theme-used'
  return 'theme-expired'
}

function stampText(status: string) {
  if (status === 'USED') return '已核销'
  if (status === 'EXPIRED') return '已过期'
  if (status === 'TRANSFERRED') return '已转赠'
  if (status === 'REFUNDED') return '已退款'
  return status
}

function showQrcode(item: any) {
  uni.navigateTo({ url: `/pages/tickets/qrcode?id=${item.id}&name=${encodeURIComponent(item.performanceName)}` })
}
function onTransfer(item: any) {
  uni.showLoading({ title: '生成转赠链接...' })
  startTransfer(item.id)
    .then((res: any) => {
      uni.hideLoading()
      const token = res?.transferToken || ''
      if (!token) { uni.showToast({ title: '生成失败', icon: 'none' }); return }
      showTransferModal(item, token)
    })
    .catch(() => uni.hideLoading())
}

function showTransferModal(item: any, token: string) {
  uni.showModal({
    title: '转赠成功',
    content: `转赠链接已生成，24 小时内有效。受赠人打开链接即可领取。`,
    confirmText: '复制链接',
    cancelText: '关闭',
    success: (res) => {
      if (res.confirm) {
        uni.setClipboardData({ data: token })
      }
    }
  })
}
function goDetail(item: any) { uni.navigateTo({ url: `/pages/detail/index?id=${item.performanceId}` }) }
function goLogin() { uni.navigateTo({ url: '/pages/profile/login' }) }

function canReview(item: any) {
  if (item.orderStatus !== 'ATTENDED') return false
  if (!item.endAt) return false
  return new Date(item.endAt).getTime() < Date.now()
}
function goReview(item: any) {
  uni.navigateTo({ url: `/pages/review/post?perfId=${item.performanceId}` })
}
function goMyReview(item: any) {
  if (item.reviewId) {
    uni.navigateTo({ url: `/pages/review/detail?id=${item.reviewId}&perfId=${item.performanceId}` })
  } else {
    uni.navigateTo({ url: `/pages/review/list?id=${item.performanceId}` })
  }
}
</script>

<style scoped>
.tickets { min-height: 100vh; background: #f0f2f5; }

.login-prompt { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 200rpx 0; }
.login-icon { font-size: 120rpx; margin-bottom: 32rpx; }
.login-text { font-size: 30rpx; color: #666; margin-bottom: 40rpx; }
.login-btn { padding: 20rpx 80rpx; background: #FF6B35; border-radius: 44rpx; }
.login-btn-text { font-size: 30rpx; color: #fff; font-weight: 600; }

.segment { display: flex; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.seg-item { flex: 1; text-align: center; padding: 24rpx 0; font-size: 26rpx; color: #999; position: relative; }
.seg-item.active { color: #333; font-weight: 600; }
.seg-item.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; background: #FF6B35; border-radius: 4rpx; }

.ticket-list { height: calc(100vh - 90rpx); }
.loading { text-align: center; padding: 120rpx 0; font-size: 28rpx; color: #999; }
.empty-wrap { padding-top: 120rpx; }

.ticket-cards { padding: 24rpx; }

/* === 实体票卡片 === */
.ticket-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 28rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  position: relative;
}

/* 左侧色带 */
.left-band {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 8rpx;
}
.theme-active .left-band { background: linear-gradient(180deg, #FF6B35, #FF3B3B); }
.theme-used .left-band { background: #bbb; }
.theme-expired .left-band { background: #ddd; }

/* 上半部分 */
.ticket-top { padding: 28rpx 28rpx 20rpx 32rpx; }
.perf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20rpx; }
.perf-name { font-size: 32rpx; font-weight: 700; color: #1a1d21; flex: 1; line-height: 1.4; }
.perf-type { font-size: 20rpx; color: #FF6B35; border: 1rpx solid #FF6B35; border-radius: 4rpx; padding: 2rpx 12rpx; flex-shrink: 0; margin-left: 12rpx; }
.theme-used .perf-type { color: #999; border-color: #ccc; }

/* 信息网格 */
.info-grid { display: flex; flex-wrap: wrap; gap: 16rpx 0; }
.info-cell { width: 50%; display: flex; flex-direction: column; gap: 4rpx; }
.cell-label { font-size: 20rpx; color: #999; }
.cell-value { font-size: 26rpx; color: #333; font-weight: 500; }
.seat-value { color: #FF6B35; font-weight: 700; }
.theme-used .seat-value { color: #999; }

/* 撕齿分割线 */
.tear-line { display: flex; align-items: center; position: relative; height: 0; }
.tear-circle { width: 32rpx; height: 32rpx; background: #f0f2f5; border-radius: 50%; position: absolute; }
.tear-circle.left { left: -16rpx; }
.tear-circle.right { right: -16rpx; }
.tear-dash { flex: 1; border-top: 2rpx dashed #e0e0e0; margin: 0 16rpx; }

/* 下半部分 */
.ticket-bottom { display: flex; padding: 24rpx 28rpx 24rpx 32rpx; gap: 24rpx; }
.bottom-left { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.amount-row { display: flex; align-items: baseline; gap: 8rpx; }
.amount-label { font-size: 20rpx; color: #999; }
.amount-value { font-size: 36rpx; font-weight: 700; color: #FF6B35; }
.theme-used .amount-value { color: #999; }
.zone-tag { font-size: 22rpx; color: #666; background: #f5f5f5; padding: 2rpx 12rpx; border-radius: 4rpx; align-self: flex-start; }
.attendee-row { display: flex; align-items: center; gap: 8rpx; }
.attendee-label { font-size: 20rpx; color: #999; }
.attendee-value { font-size: 22rpx; color: #666; }

/* 二维码区域 */
.bottom-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.qr-box { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.qr-pattern-mini { width: 120rpx; height: 120rpx; background: #f8f8f8; border: 2rpx solid #333; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; }
.theme-used .qr-pattern-mini { border-color: #ccc; }
.qr-mini-text { font-size: 20rpx; color: #333; font-weight: 600; }
.theme-used .qr-mini-text { color: #ccc; }
.qr-label { font-size: 18rpx; color: #FF6B35; }
.theme-used .qr-label { color: #ccc; }

/* 状态印章 */
.status-stamp { width: 120rpx; height: 120rpx; display: flex; align-items: center; justify-content: center; border: 4rpx solid; border-radius: 50%; transform: rotate(-15deg); }
.theme-used .status-stamp { border-color: #ccc; }
.theme-expired .status-stamp { border-color: #ddd; }
.stamp-text { font-size: 24rpx; color: #ccc; font-weight: 700; }

/* 底部操作栏 */
.ticket-actions { display: flex; border-top: 1rpx solid #f0f0f0; }
.t-action { flex: 1; text-align: center; padding: 20rpx 0; }
.t-action-text { font-size: 26rpx; color: #666; }
.t-action-divider { width: 1rpx; background: #f0f0f0; }
</style>
