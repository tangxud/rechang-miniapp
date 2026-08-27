<template>
  <view class="confirm-page">
    <view class="nav-bar"><text class="nav-back" @tap="goBack">‹</text><text class="nav-title">确认订单</text></view>

    <scroll-view scroll-y class="content">
      <view v-if="loading" class="loading"><text>加载中...</text></view>
      <template v-if="!loading">
        <!-- 演出信息 -->
        <view class="card perf-card">
          <image class="poster" :src="detail.posterUrl || placeholder" mode="aspectFill" />
          <view class="perf-info">
            <text class="perf-name">{{ detail.name }}</text>
            <text class="perf-date">{{ formatDateTime(detail.startAt) }}</text>
            <text class="perf-venue">{{ detail.venue?.venueName }}</text>
          </view>
        </view>

        <!-- 乘车人式选座列表（12306风格） -->
        <view class="card">
          <view class="card-header">
            <text class="card-title">票面信息</text>
            <text class="card-count">共{{ seatList.length }}张</text>
          </view>

          <view v-for="(seat, i) in seatList" :key="i" class="ticket-row">
            <!-- 左侧：座位信息 -->
            <view class="seat-info">
              <text class="seat-label">{{ seat.label }}</text>
              <text class="seat-price">¥{{ formatPrice(seat.price) }}</text>
            </view>
            <!-- 右侧：观演人选择器 -->
            <view class="attendee-picker" @tap="openAttendeePicker(i)">
              <template v-if="seat.attendee">
                <view class="attendee-detail">
                  <text class="attendee-name">{{ seat.attendee.name }}</text>
                  <text class="attendee-id">{{ seat.attendee.masked }}</text>
                </view>
                <text class="picker-arrow">›</text>
              </template>
              <template v-else>
                <text class="picker-placeholder">选择观演人</text>
                <text class="picker-arrow">›</text>
              </template>
            </view>
          </view>

          <!-- 添加观演人入口 -->
          <view v-if="allAttendees.length < seatList.length" class="add-attendee-row" @tap="goAddAttendee">
            <text class="add-attendee-text">+ 添加常用观演人</text>
          </view>
        </view>

        <!-- 费用明细 -->
        <view class="card">
          <view class="cost-row"><text>票款（{{ seatList.length }}张）</text><text>¥{{ formatPrice(totalAmount) }}</text></view>
          <view class="cost-row"><text>服务费</text><text>¥0</text></view>
          <view class="cost-row total"><text>合计</text><text class="total-price">¥{{ formatPrice(totalAmount) }}</text></view>
          <view v-if="detail.isStrongRealName" class="realname-tip">⚠ 强实名演出：入场需人脸核验，票面身份=入场人身份</view>
        </view>
      </template>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="pay-amount">
        <text class="pay-label">支付金额</text>
        <text class="pay-value">¥{{ formatPrice(totalAmount) }}</text>
      </view>
      <view class="submit-btn" :class="{ disabled: submitting }" @tap="onSubmit">
        <text class="submit-text">{{ submitting ? '提交中...' : '提交订单' }}</text>
      </view>
    </view>

    <!-- 观演人选择弹窗 -->
    <view v-if="pickerVisible" class="picker-mask" @tap="closePicker">
      <view class="picker-sheet" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择观演人</text>
          <text class="picker-close" @tap="closePicker">✕</text>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view
            v-for="a in allAttendees" :key="a.id"
            class="picker-item" :class="{ disabled: isAttendeeUsed(a.id) && a.id !== currentPickerAttendeeId }"
            @tap="selectAttendee(a)"
          >
            <view class="picker-item-info">
              <text class="picker-item-name">{{ a.name }}</text>
              <text class="picker-item-id">{{ a.idCardMasked || '未录入身份证' }}</text>
            </view>
            <text v-if="isAttendeeUsed(a.id) && a.id !== currentPickerAttendeeId" class="picker-item-tag">已选</text>
            <text v-else-if="a.id === currentPickerAttendeeId" class="picker-item-tag active">当前</text>
          </view>
        </scroll-view>
        <view class="picker-footer" @tap="goAddAttendee">
          <text class="picker-footer-text">+ 添加新观演人</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getShowDetail } from '../../api/show'
import { getAttendeeList } from '../../api/attendee'
import { createOrder } from '../../api/order'

const placeholder = 'https://cdn.rechang.com/placeholder.jpg'
const loading = ref(true)
const submitting = ref(false)

const perfId = ref(0)
const detail = ref<any>({})
const seatList = ref<{
  label: string
  price: number
  seatId?: number
  attendee?: { id: number; name: string; masked: string } | null
}[]>([])
const isStanding = ref(false)
const allAttendees = ref<any[]>([])

// 观演人选择弹窗
const pickerVisible = ref(false)
const currentPickerIndex = ref(-1)
const currentPickerAttendeeId = ref<number | null>(null)

const totalAmount = computed(() => seatList.value.reduce((sum, s) => sum + s.price, 0))
const allAssigned = computed(() => seatList.value.every(s => s.attendee))

onLoad(async (options: any) => {
  perfId.value = Number(options?.pid || 0)
  const count = Number(options?.count || 0)
  isStanding.value = options?.standing === '1'
  const amount = Number(options?.amount || 0)

  if (isStanding.value) {
    const perPrice = count > 0 ? amount / count : 0
    for (let i = 0; i < count; i++) {
      seatList.value.push({ label: `通票 ${i + 1}`, price: perPrice, attendee: null })
    }
  } else {
    const labels = (options?.seatLabels || '').split(',').filter(Boolean)
    const seatIds = (options?.seatIds || '').split(',').filter(Boolean).map(Number)
    const perPrice = count > 0 ? amount / count : 0
    labels.forEach((label: string, i: number) => {
      seatList.value.push({ label, price: perPrice, seatId: seatIds[i], attendee: null })
    })
  }

  await loadData()
})

onShow(() => {
  // 从添加观演人页面返回时刷新列表
  if (!loading.value) loadAttendees()
})

async function loadData() {
  loading.value = true
  try {
    await Promise.all([loadDetail(), loadAttendees()])
    // 自动分配：前N个观演人分配给N张票
    autoAssignAttendees()
  } catch (e) {} finally { loading.value = false }
}

async function loadDetail() {
  detail.value = await getShowDetail(perfId.value)
}

async function loadAttendees() {
  const list: any = await getAttendeeList()
  allAttendees.value = Array.isArray(list) ? list : (list?.list || [])
  // 重新自动分配（保留已选的）
  autoAssignAttendees()
}

function autoAssignAttendees() {
  const usedIds = new Set(seatList.value.filter(s => s.attendee).map(s => s.attendee!.id))
  for (const seat of seatList.value) {
    if (seat.attendee) continue
    const available = allAttendees.value.find((a: any) => !usedIds.has(a.id))
    if (available) {
      seat.attendee = { id: available.id, name: available.name, masked: available.idCardMasked || '' }
      usedIds.add(available.id)
    }
  }
}

function openAttendeePicker(index: number) {
  currentPickerIndex.value = index
  currentPickerAttendeeId.value = seatList.value[index]?.attendee?.id || null
  pickerVisible.value = true
}

function closePicker() {
  pickerVisible.value = false
  currentPickerIndex.value = -1
  currentPickerAttendeeId.value = null
}

function selectAttendee(a: any) {
  // 已被其他座位选用的观演人不能重复选（当前选中的除外）
  if (isAttendeeUsed(a.id) && a.id !== currentPickerAttendeeId.value) {
    uni.showToast({ title: '该观演人已选择', icon: 'none' })
    return
  }
  const idx = currentPickerIndex.value
  if (idx >= 0) {
    seatList.value[idx].attendee = { id: a.id, name: a.name, masked: a.idCardMasked || '' }
  }
  closePicker()
}

function isAttendeeUsed(id: number): boolean {
  return seatList.value.some(s => s.attendee?.id === id)
}

function goAddAttendee() {
  closePicker()
  uni.navigateTo({ url: '/pages/profile/attendee-edit' })
}

async function onSubmit() {
  if (!allAssigned.value) {
    uni.showToast({ title: '请为每张票选择观演人', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const seatIds = seatList.value.map(s => s.seatId).filter((id): id is number => id != null)
    const order: any = await createOrder({
      performanceId: perfId.value,
      seatIds: isStanding.value ? [] : seatIds,
      standingCount: isStanding.value ? seatList.value.length : undefined,
      attendees: seatList.value.map(s => ({ attendeeId: s.attendee!.id }))
    })
    uni.redirectTo({ url: `/pages/order/pay?id=${order.id}&amount=${totalAmount.value}` })
  } catch (e) {} finally { submitting.value = false }
}

function formatPrice(cents: number) { const y = cents / 100; return Number.isInteger(y) ? y.toString() : y.toFixed(2) }
function formatDateTime(d: string) { return d ? d.replace(/-/g, '.').replace('T', ' ').substring(0, 16) : '' }
function goBack() { uni.navigateBack() }
</script>

<style scoped>
.confirm-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.nav-bar { display: flex; align-items: center; gap: 16rpx; padding: 0 24rpx; height: 88rpx; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.nav-back { font-size: 48rpx; color: #222; }
.nav-title { font-size: 32rpx; font-weight: 600; color: #222; }
.content { flex: 1; }
.loading { text-align: center; padding: 120rpx 0; font-size: 28rpx; color: #999; }

.card { margin: 24rpx; padding: 24rpx; background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.perf-card { display: flex; gap: 20rpx; }
.poster { width: 96rpx; height: 128rpx; border-radius: 8rpx; background: #f0f0f0; flex-shrink: 0; }
.perf-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.perf-name { font-size: 28rpx; font-weight: 600; color: #222; }
.perf-date { font-size: 24rpx; color: #999; }
.perf-venue { font-size: 24rpx; color: #999; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.card-title { font-size: 28rpx; font-weight: 600; color: #222; }
.card-count { font-size: 24rpx; color: #999; }

/* 12306风格票面行 */
.ticket-row { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.ticket-row:last-child { border-bottom: none; }
.seat-info { display: flex; flex-direction: column; gap: 4rpx; flex-shrink: 0; }
.seat-label { font-size: 28rpx; color: #333; font-weight: 500; }
.seat-price { font-size: 24rpx; color: #FF6B35; font-weight: 600; }

.attendee-picker { display: flex; align-items: center; gap: 8rpx; flex: 1; justify-content: flex-end; }
.attendee-detail { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; }
.attendee-name { font-size: 28rpx; color: #333; font-weight: 500; }
.attendee-id { font-size: 22rpx; color: #999; }
.picker-arrow { font-size: 32rpx; color: #ccc; }
.picker-placeholder { font-size: 28rpx; color: #bbb; }

.add-attendee-row { padding: 20rpx 0; text-align: center; }
.add-attendee-text { font-size: 26rpx; color: #FF6B35; }

.cost-row { display: flex; justify-content: space-between; padding: 8rpx 0; font-size: 26rpx; color: #666; }
.cost-row.total { padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; margin-top: 8rpx; font-weight: 600; color: #333; }
.total-price { color: #FF6B35; font-size: 32rpx; }
.realname-tip { font-size: 22rpx; color: #FF6B35; margin-top: 12rpx; padding: 12rpx; background: #fff4e6; border-radius: 8rpx; }

.action-bar { display: flex; align-items: center; padding: 16rpx 24rpx; background: #fff; border-top: 1rpx solid #eef0f3; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); }
.pay-amount { flex: 1; }
.pay-label { font-size: 22rpx; color: #999; display: block; }
.pay-value { font-size: 40rpx; font-weight: 700; color: #FF6B35; }
.submit-btn { padding: 20rpx 56rpx; background: linear-gradient(135deg, #FF6B35, #FF3B3B); border-radius: 44rpx; }
.submit-btn.disabled { opacity: 0.6; }
.submit-text { font-size: 30rpx; font-weight: 600; color: #fff; }

/* 观演人选择弹窗 */
.picker-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.picker-sheet { width: 100%; background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 70vh; display: flex; flex-direction: column; }
.picker-header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 32rpx; border-bottom: 1rpx solid #f0f0f0; }
.picker-title { font-size: 30rpx; font-weight: 600; color: #333; }
.picker-close { font-size: 32rpx; color: #999; }
.picker-list { flex: 1; max-height: 50vh; }
.picker-item { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 32rpx; border-bottom: 1rpx solid #f5f5f5; }
.picker-item.disabled { opacity: 0.4; }
.picker-item-info { display: flex; flex-direction: column; gap: 4rpx; }
.picker-item-name { font-size: 30rpx; color: #333; font-weight: 500; }
.picker-item-id { font-size: 24rpx; color: #999; }
.picker-item-tag { font-size: 22rpx; color: #999; padding: 4rpx 16rpx; background: #f0f0f0; border-radius: 8rpx; }
.picker-item-tag.active { background: #fff0eb; color: #FF6B35; }
.picker-footer { padding: 24rpx 32rpx; text-align: center; border-top: 1rpx solid #f0f0f0; }
.picker-footer-text { font-size: 28rpx; color: #FF6B35; font-weight: 500; }
</style>
