<template>
  <view class="refund-page">
    <view class="nav-bar"><text class="nav-back" @tap="goBack">‹</text><text class="nav-title">申请退票</text></view>

    <scroll-view scroll-y class="content">
      <view v-if="loading" class="loading"><text>加载中...</text></view>

      <template v-if="!loading && order">
        <!-- 演出信息 -->
        <view class="card perf-card">
          <image class="poster" :src="order.poster_url || placeholder" mode="aspectFill" />
          <view class="perf-info">
            <text class="perf-name">{{ order.performance_name }}</text>
            <text class="order-no">订单号 {{ order.order_no }}</text>
            <text class="order-amount">支付金额 ¥{{ formatPrice(order.total_amount) }}</text>
          </view>
        </view>

        <!-- 选择退票 -->
        <view class="card">
          <text class="card-title">选择退票（可多选）</text>
          <view v-for="t in refundableTickets" :key="t.id" class="ticket-select" @tap="toggleTicket(t)">
            <view class="check-box" :class="{ checked: selectedTickets.includes(t.id) }">
              <text v-if="selectedTickets.includes(t.id)" class="check-icon">✓</text>
            </view>
            <view class="ticket-info">
              <text class="ticket-seat">{{ t.seat_label }}</text>
              <text class="ticket-attendee">{{ t.attendee_name || '未绑定观演人' }}</text>
            </view>
            <text class="ticket-price">¥{{ formatPrice(t.face_amount) }}</text>
          </view>
        </view>

        <!-- 退票预览 -->
        <view v-if="selectedTickets.length > 0" class="card">
          <text class="card-title">退票明细</text>
          <view v-for="p in previews" :key="p.ticket_id" class="preview-row">
            <view class="preview-left">
              <text class="preview-seat">{{ p.seat_label }}</text>
              <text class="preview-stage" :class="stageClass(p.stage)">{{ p.stage_desc }}</text>
            </view>
            <view class="preview-right">
              <text v-if="p.fee_amount > 0" class="preview-fee">手续费 ¥{{ formatPrice(p.fee_amount) }}</text>
              <text v-else class="preview-fee free">无手续费</text>
              <text class="preview-refund">退 ¥{{ formatPrice(p.refund_amount) }}</text>
            </view>
          </view>

          <view class="summary-row">
            <view class="summary-item"><text class="summary-label">票款合计</text><text class="summary-value">¥{{ formatPrice(totalTicketAmount) }}</text></view>
            <view class="summary-item"><text class="summary-label">手续费合计</text><text class="summary-value fee-color">¥{{ formatPrice(totalFee) }}</text></view>
            <view class="summary-item total-row"><text class="summary-label">实际退款</text><text class="summary-value refund-color">¥{{ formatPrice(totalRefund) }}</text></view>
          </view>
          <text class="arrival-tip">预计 {{ estimatedArrival }} 到账</text>
        </view>

        <!-- 退票原因 -->
        <view v-if="selectedTickets.length > 0" class="card">
          <text class="card-title">退票原因</text>
          <view class="reason-tabs">
            <text class="reason-tab" :class="{ active: refundType === 'PERSONAL' }" @tap="refundType = 'PERSONAL'">个人原因</text>
            <text class="reason-tab" :class="{ active: refundType === 'FORCE_MAJEURE' }" @tap="refundType = 'FORCE_MAJEURE'">不可抗力</text>
          </view>
          <textarea
            class="reason-input"
            v-model="reason"
            :placeholder="refundType === 'FORCE_MAJEURE' ? '请描述不可抗力原因（如天气、疫情等）' : '请输入退票原因（选填）'"
            placeholder-class="placeholder"
            maxlength="200"
          />
          <view v-if="refundType === 'FORCE_MAJEURE'" class="evidence-section">
            <text class="evidence-label">上传凭证（至少1张）</text>
            <view class="evidence-grid">
              <view v-for="(url, i) in evidenceUrls" :key="i" class="evidence-img">
                <image :src="url" mode="aspectFill" />
                <text class="evidence-del" @tap="evidenceUrls.splice(i, 1)">✕</text>
              </view>
              <view v-if="evidenceUrls.length < 6" class="evidence-add" @tap="addEvidence">
                <text class="add-icon">+</text>
              </view>
            </view>
            <text class="evidence-note">不可抗力退票0%手续费，需人工审核（24h内处理）</text>
          </view>
        </view>

        <!-- 退款记录 -->
        <view v-if="refundRecords.length > 0" class="card">
          <text class="card-title">退款记录</text>
          <view v-for="r in refundRecords" :key="r.id" class="record-row">
            <view class="record-left">
              <text class="record-no">{{ r.refund_no }}</text>
              <text class="record-type">{{ refundTypeLabel(r.refund_type) }} · ¥{{ formatPrice(r.refund_amount) }}</text>
            </view>
            <text class="record-status" :class="recordStatusClass(r.status)">{{ recordStatusLabel(r.status) }}</text>
          </view>
        </view>
      </template>
    </scroll-view>

    <!-- 底部操作 -->
    <view v-if="selectedTickets.length > 0" class="action-bar">
      <view class="refund-summary">
        <text class="refund-count">退{{ selectedTickets.length }}张</text>
        <text class="refund-amount">退款 ¥{{ formatPrice(totalRefund) }}</text>
      </view>
      <view class="submit-btn" :class="{ disabled: submitting }" @tap="onSubmit">
        <text class="submit-text">{{ submitting ? '提交中...' : '确认退票' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getOrderDetail } from '../../api/order'
import { previewRefund, refundTicket, refundForceMajeure, getRefundRecords } from '../../api/refund'

const placeholder = 'https://cdn.rechang.com/placeholder.jpg'
const loading = ref(true)
const submitting = ref(false)

const orderId = ref(0)
const order = ref<any>(null)
const refundableTickets = ref<any[]>([])
const selectedTickets = ref<number[]>([])
const previews = ref<any[]>([])
const refundRecords = ref<any[]>([])

const refundType = ref('PERSONAL')
const reason = ref('')
const evidenceUrls = ref<string[]>([])

const totalTicketAmount = computed(() => previews.value.reduce((s, p) => s + (p.ticket_amount || 0), 0))
const totalFee = computed(() => previews.value.reduce((s, p) => s + (p.fee_amount || 0), 0))
const totalRefund = computed(() => previews.value.reduce((s, p) => s + (p.refund_amount || 0), 0))
const estimatedArrival = computed(() => refundType.value === 'FORCE_MAJEURE' ? '审核通过后3-7个工作日' : '3-7个工作日')

onLoad((options: any) => {
  orderId.value = Number(options?.orderId || 0)
  if (orderId.value) loadData()
})

onShow(() => {
  if (orderId.value && !loading.value) loadRecords()
})

async function loadData() {
  loading.value = true
  try {
    const [detail, records] = await Promise.all([
      getOrderDetail(orderId.value),
      getRefundRecords(orderId.value).catch(() => [])
    ])
    order.value = detail
    refundRecords.value = Array.isArray(records) ? records : (records?.list || [])
    refundableTickets.value = (detail.tickets || []).filter((t: any) => t.status === 'USABLE' || t.status === 'USED')
  } catch (e) {} finally { loading.value = false }
}

async function loadRecords() {
  try {
    const records: any = await getRefundRecords(orderId.value)
    refundRecords.value = Array.isArray(records) ? records : (records?.list || [])
  } catch (e) {}
}

async function toggleTicket(ticket: any) {
  const idx = selectedTickets.value.indexOf(ticket.id)
  if (idx >= 0) {
    selectedTickets.value.splice(idx, 1)
    previews.value = previews.value.filter((p: any) => p.ticket_id !== ticket.id)
  } else {
    selectedTickets.value.push(ticket.id)
    try {
      const preview: any = await previewRefund(orderId.value, ticket.id)
      previews.value.push(preview)
    } catch (e) {}
  }
}

function addEvidence() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      // MVP: 直接用临时路径，实际应上传到OSS
      evidenceUrls.value.push(res.tempFilePaths[0])
    }
  })
}

async function onSubmit() {
  if (selectedTickets.value.length === 0) {
    uni.showToast({ title: '请选择要退的票', icon: 'none' })
    return
  }
  if (refundType.value === 'FORCE_MAJEURE') {
    if (!reason.value.trim()) {
      uni.showToast({ title: '请填写不可抗力原因', icon: 'none' })
      return
    }
    if (evidenceUrls.value.length === 0) {
      uni.showToast({ title: '请至少上传1张凭证', icon: 'none' })
      return
    }
  }

  uni.showModal({
    title: '确认退票',
    content: `共退${selectedTickets.value.length}张票，退款金额 ¥${formatPrice(totalRefund.value)}，确认退票吗？`,
    success: async (res) => {
      if (!res.confirm) return
      submitting.value = true
      try {
        for (const ticketId of selectedTickets.value) {
          if (refundType.value === 'FORCE_MAJEURE') {
            await refundForceMajeure(orderId.value, ticketId, reason.value, evidenceUrls.value)
          } else {
            await refundTicket(orderId.value, ticketId, reason.value || '个人原因')
          }
        }
        uni.showToast({ title: '退票成功', icon: 'success' })
        selectedTickets.value = []
        previews.value = []
        reason.value = ''
        evidenceUrls.value = []
        await loadData()
      } catch (e) {} finally { submitting.value = false }
    }
  })
}

function formatPrice(cents: number) { const y = cents / 100; return Number.isInteger(y) ? y.toString() : y.toFixed(2) }
function stageClass(stage: string) {
  if (stage === 'NOT_REFUNDABLE') return 'stage-danger'
  if (stage === 'LATE') return 'stage-warn'
  return 'stage-ok'
}
function refundTypeLabel(t: string) { return t === 'PERSONAL' ? '个人原因' : t === 'FORCE_MAJEURE' ? '不可抗力' : t }
function recordStatusLabel(s: string) { const m: Record<string,string> = { PENDING:'审核中', PROCESSING:'退款中', SUCCESS:'已退款', FAILED:'退款失败' }; return m[s] || s }
function recordStatusClass(s: string) { if (s === 'SUCCESS') return 'st-green'; if (s === 'PENDING') return 'st-orange'; return 'st-gray' }
function goBack() { uni.navigateBack() }
</script>

<style scoped>
.refund-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.nav-bar { display: flex; align-items: center; gap: 16rpx; padding: 0 24rpx; height: 88rpx; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.nav-back { font-size: 48rpx; color: #222; }
.nav-title { font-size: 32rpx; font-weight: 600; color: #222; }
.content { flex: 1; }
.loading { text-align: center; padding: 120rpx 0; font-size: 28rpx; color: #999; }

.card { margin: 24rpx; padding: 24rpx; background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.perf-card { display: flex; gap: 16rpx; }
.poster { width: 96rpx; height: 128rpx; border-radius: 8rpx; background: #f0f0f0; flex-shrink: 0; }
.perf-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.perf-name { font-size: 28rpx; font-weight: 600; color: #222; }
.order-no { font-size: 22rpx; color: #999; }
.order-amount { font-size: 24rpx; color: #666; }

.card-title { font-size: 28rpx; font-weight: 600; color: #222; display: block; margin-bottom: 16rpx; }

.ticket-select { display: flex; align-items: center; gap: 16rpx; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.check-box { width: 36rpx; height: 36rpx; border: 2rpx solid #ddd; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.check-box.checked { background: #FF6B35; border-color: #FF6B35; }
.check-icon { color: #fff; font-size: 24rpx; }
.ticket-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.ticket-seat { font-size: 26rpx; color: #333; }
.ticket-attendee { font-size: 22rpx; color: #999; }
.ticket-price { font-size: 26rpx; color: #FF6B35; font-weight: 600; }

.preview-row { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.preview-left { display: flex; flex-direction: column; gap: 4rpx; }
.preview-seat { font-size: 26rpx; color: #333; }
.preview-stage { font-size: 22rpx; padding: 2rpx 12rpx; border-radius: 4rpx; align-self: flex-start; }
.stage-ok { background: #e8f5e9; color: #4caf50; }
.stage-warn { background: #fff3e0; color: #ff9800; }
.stage-danger { background: #fee2e2; color: #ef4444; }
.preview-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; }
.preview-fee { font-size: 22rpx; color: #999; }
.preview-fee.free { color: #4caf50; }
.preview-refund { font-size: 28rpx; font-weight: 600; color: #FF6B35; }

.summary-row { margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
.summary-item { display: flex; justify-content: space-between; padding: 4rpx 0; }
.summary-label { font-size: 24rpx; color: #999; }
.summary-value { font-size: 24rpx; color: #666; }
.fee-color { color: #ff9800; }
.total-row .summary-label { font-size: 28rpx; font-weight: 600; color: #333; }
.total-row .summary-value { font-size: 32rpx; font-weight: 700; }
.refund-color { color: #FF6B35; }
.arrival-tip { font-size: 22rpx; color: #999; display: block; margin-top: 8rpx; }

.reason-tabs { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.reason-tab { padding: 12rpx 32rpx; border-radius: 24rpx; font-size: 26rpx; background: #f5f5f5; color: #666; }
.reason-tab.active { background: #FF6B35; color: #fff; }
.reason-input { width: 100%; height: 160rpx; background: #f9f9f9; border-radius: 12rpx; padding: 16rpx; font-size: 26rpx; color: #333; box-sizing: border-box; }
.placeholder { color: #bbb; }

.evidence-section { margin-top: 20rpx; }
.evidence-label { font-size: 26rpx; color: #333; display: block; margin-bottom: 12rpx; }
.evidence-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.evidence-img { width: 160rpx; height: 160rpx; border-radius: 8rpx; overflow: hidden; position: relative; }
.evidence-img image { width: 100%; height: 100%; }
.evidence-del { position: absolute; top: 4rpx; right: 4rpx; width: 36rpx; height: 36rpx; background: rgba(0,0,0,0.5); border-radius: 50%; color: #fff; font-size: 20rpx; text-align: center; line-height: 36rpx; }
.evidence-add { width: 160rpx; height: 160rpx; border: 2rpx dashed #ddd; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; }
.add-icon { font-size: 48rpx; color: #ccc; }
.evidence-note { font-size: 22rpx; color: #3b82f6; display: block; margin-top: 12rpx; }

.record-row { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.record-left { display: flex; flex-direction: column; gap: 4rpx; }
.record-no { font-size: 24rpx; color: #333; }
.record-type { font-size: 22rpx; color: #999; }
.record-status { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 8rpx; }
.st-green { background: #e8f5e9; color: #4caf50; }
.st-orange { background: #fff3e0; color: #ff9800; }
.st-gray { background: #f0f0f0; color: #999; }

.action-bar { display: flex; align-items: center; padding: 16rpx 24rpx; background: #fff; border-top: 1rpx solid #eef0f3; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); }
.refund-summary { flex: 1; display: flex; flex-direction: column; }
.refund-count { font-size: 22rpx; color: #999; }
.refund-amount { font-size: 36rpx; font-weight: 700; color: #FF6B35; }
.submit-btn { padding: 20rpx 56rpx; background: linear-gradient(135deg, #FF6B35, #FF3B3B); border-radius: 44rpx; }
.submit-btn.disabled { opacity: 0.6; }
.submit-text { font-size: 30rpx; font-weight: 600; color: #fff; }
</style>
