<template>
  <view class="seat-page">
    <view class="nav-bar">
      <text class="nav-back" @tap="goBack">‹</text>
      <text class="nav-title">选座</text>
      <text class="nav-action" @tap="showToast('3D选座开发中')">3D</text>
    </view>

    <scroll-view scroll-y class="seat-content">
      <view v-if="loading" class="loading"><text>加载中...</text></view>

      <template v-if="seatMap">
        <!-- 舞台 -->
        <view class="stage">
          <text class="stage-text">舞台 / STAGE</text>
        </view>

        <!-- 图例 -->
        <view class="legend">
          <view class="legend-item"><view class="dot dot-available"></view><text>可选</text></view>
          <view class="legend-item"><view class="dot dot-selected"></view><text>已选</text></view>
          <view class="legend-item"><view class="dot dot-sold"></view><text>已售</text></view>
          <view class="legend-item"><view class="dot dot-locked"></view><text>锁定</text></view>
        </view>

        <!-- 站票模式 -->
        <view v-if="seatMap.is_standing" class="standing-section">
          <text class="standing-title">通票（无需选座）</text>
          <view class="zone-cards">
            <view
              v-for="zone in seatMap.price_zones" :key="zone.region"
              class="zone-card" :class="{ active: selectedZone === zone.region }"
              @tap="selectStandingZone(zone)"
            >
              <text class="zone-name">{{ zone.zone_name }}</text>
              <text class="zone-price">¥{{ formatPrice(zone.price) }}</text>
            </view>
          </view>
          <view class="standing-count">
            <text class="count-label">购买张数</text>
            <view class="count-ctrl">
              <text class="count-btn" @tap="standingCount = Math.max(1, standingCount - 1)">−</text>
              <text class="count-num">{{ standingCount }}</text>
              <text class="count-btn" @tap="standingCount = Math.min(4, standingCount + 1)">+</text>
            </view>
          </view>
        </view>

        <!-- 座位图 -->
        <view v-else class="seat-grid-wrap">
          <view
            v-for="region in seatMap.regions" :key="region.region"
            class="region-block"
          >
            <view class="region-header">
              <text class="region-name">{{ region.region }}</text>
              <text class="region-price">¥{{ formatPrice(region.price) }}</text>
            </view>
            <view
              v-for="row in region.rows" :key="row.row_label"
              class="seat-row"
            >
              <text class="row-label">{{ row.row_label }}排</text>
              <view class="seats">
                <view
                  v-for="seat in row.seats" :key="seat.seat_id"
                  class="seat" :class="seatClass(seat)"
                  @tap="toggleSeat(seat)"
                >
                  <text class="seat-col">{{ seat.col_label }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </template>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="seatMap" class="action-bar">
      <view class="action-info">
        <text class="info-count">已选 {{ selectedSeats.length || standingCount }} 张</text>
        <text v-if="selectedSeats.length > 0" class="info-detail">
          {{ selectedSeats.map(s => s.seat_label).join(' / ') }} · ¥{{ formatPrice(totalAmount) }}
        </text>
        <text v-else-if="seatMap.is_standing" class="info-detail">
          {{ standingCount }}张 × ¥{{ formatPrice(standingPrice) }}
        </text>
      </view>
      <view class="confirm-btn" @tap="goConfirm">
        <text class="confirm-text">确认选座</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getSeatMap } from '../../api/seat'

const perfId = ref(0)
const seatMap = ref<any>(null)
const loading = ref(false)
const selectedSeats = ref<any[]>([])

const selectedZone = ref('')
const standingCount = ref(1)

const standingPrice = computed(() => {
  if (!seatMap.value?.is_standing || !selectedZone.value) return 0
  const zone = seatMap.value.price_zones.find((z: any) => z.region === selectedZone.value)
  return zone?.price || 0
})

const totalAmount = computed(() => {
  return selectedSeats.value.reduce((sum, s) => sum + (s._price || 0), 0)
})

onLoad((options: any) => {
  perfId.value = Number(options?.id || 0)
  if (perfId.value) loadSeatMap()
})

async function loadSeatMap() {
  loading.value = true
  try {
    const data: any = await getSeatMap(perfId.value)
    seatMap.value = data
  } catch (e) {
    // handled by request util
  } finally {
    loading.value = false
  }
}

function toggleSeat(seat: any) {
  if (seat.status !== 'AVAILABLE') return
  const idx = selectedSeats.value.findIndex(s => s.seat_id === seat.seat_id)
  if (idx >= 0) {
    selectedSeats.value.splice(idx, 1)
  } else {
    if (selectedSeats.value.length >= 4) {
      uni.showToast({ title: '最多选4个座位', icon: 'none' })
      return
    }
    const region = seatMap.value.regions.find((r: any) =>
      r.rows.some((row: any) => row.seats.some((s: any) => s.seat_id === seat.seat_id)))
    selectedSeats.value.push({ ...seat, _price: region?.price || 0 })
  }
}

function selectStandingZone(zone: any) {
  selectedZone.value = zone.region
}

function seatClass(seat: any) {
  const isSelected = selectedSeats.value.some(s => s.seat_id === seat.seat_id)
  if (isSelected) return 'seat-selected'
  if (seat.status === 'SOLD') return 'seat-sold'
  if (seat.status === 'LOCKED') return 'seat-locked'
  if (seat.status === 'DISABLED') return 'seat-disabled'
  return 'seat-available'
}

function goConfirm() {
  const count = selectedSeats.value.length || standingCount.value
  if (count === 0) {
    uni.showToast({ title: '请选择座位', icon: 'none' })
    return
  }
  if (seatMap.value.is_standing && !selectedZone.value) {
    uni.showToast({ title: '请选择票价区域', icon: 'none' })
    return
  }
  const seatIds = selectedSeats.value.map(s => s.seat_id)
  const params = new URLSearchParams()
  params.set('pid', String(perfId.value))
  params.set('count', String(count))
  if (seatIds.length > 0) {
    params.set('seat_ids', seatIds.join(','))
    params.set('seat_labels', selectedSeats.value.map(s => s.seat_label).join(','))
    params.set('amount', String(totalAmount.value))
  } else {
    params.set('standing', '1')
    params.set('zone', selectedZone.value)
    params.set('amount', String(standingCount.value * standingPrice.value))
  }
  uni.navigateTo({ url: `/pages/order/confirm?${params.toString()}` })
}

function formatPrice(cents: number) {
  const yuan = cents / 100
  return Number.isInteger(yuan) ? yuan.toString() : yuan.toFixed(0)
}

function goBack() { uni.navigateBack() }
function showToast(msg: string) { uni.showToast({ title: msg, icon: 'none' }) }
</script>

<style scoped>
.seat-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.nav-bar { display: flex; align-items: center; justify-content: space-between; padding: 0 24rpx; height: 88rpx; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.nav-back { font-size: 48rpx; color: #222; }
.nav-title { font-size: 32rpx; font-weight: 600; color: #222; }
.nav-action { font-size: 26rpx; color: #FF6B35; }
.seat-content { flex: 1; }
.loading { text-align: center; padding: 120rpx 0; font-size: 28rpx; color: #999; }
.stage { display: flex; justify-content: center; padding: 24rpx; }
.stage-text { font-size: 24rpx; color: #999; letter-spacing: 8rpx; padding: 8rpx 32rpx; border: 1rpx solid #ddd; border-radius: 8rpx; }
.legend { display: flex; justify-content: center; gap: 24rpx; padding: 8rpx 0 20rpx; }
.legend-item { display: flex; align-items: center; gap: 6rpx; }
.legend-item text { font-size: 22rpx; color: #999; }
.dot { width: 20rpx; height: 20rpx; border-radius: 4rpx; }
.dot-available { background: #fff; border: 1rpx solid #ddd; }
.dot-selected { background: #FF6B35; }
.dot-sold { background: #ccc; }
.dot-locked { background: #ffc107; }

.region-block { margin: 0 24rpx 24rpx; }
.region-header { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0; }
.region-name { font-size: 24rpx; color: #666; font-weight: 600; }
.region-price { font-size: 24rpx; color: #FF6B35; }
.seat-row { display: flex; align-items: center; gap: 8rpx; padding: 4rpx 0; }
.row-label { font-size: 18rpx; color: #999; width: 48rpx; text-align: right; flex-shrink: 0; }
.seats { display: flex; flex-wrap: wrap; gap: 6rpx; }
.seat { width: 36rpx; height: 36rpx; border-radius: 4rpx; display: flex; align-items: center; justify-content: center; }
.seat-col { font-size: 16rpx; }
.seat-available { background: #fff; border: 1rpx solid #ddd; }
.seat-available .seat-col { color: #666; }
.seat-selected { background: #FF6B35; }
.seat-selected .seat-col { color: #fff; }
.seat-sold { background: #ccc; }
.seat-sold .seat-col { color: #999; }
.seat-locked { background: #ffc107; }
.seat-locked .seat-col { color: #fff; }
.seat-disabled { background: #eee; }
.seat-disabled .seat-col { color: #ccc; }

.standing-section { padding: 24rpx; }
.standing-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; margin-bottom: 16rpx; }
.zone-cards { display: flex; gap: 16rpx; }
.zone-card { flex: 1; padding: 24rpx; background: #fff; border: 2rpx solid #e0e0e0; border-radius: 12rpx; text-align: center; }
.zone-card.active { border-color: #FF6B35; background: #fff0eb; }
.zone-name { font-size: 26rpx; color: #333; display: block; }
.zone-price { font-size: 32rpx; font-weight: 700; color: #FF6B35; display: block; margin-top: 8rpx; }
.standing-count { display: flex; justify-content: space-between; align-items: center; margin-top: 32rpx; padding: 24rpx; background: #fff; border-radius: 12rpx; }
.count-label { font-size: 28rpx; color: #333; }
.count-ctrl { display: flex; align-items: center; gap: 24rpx; }
.count-btn { width: 56rpx; height: 56rpx; background: #f0f0f0; border-radius: 50%; text-align: center; line-height: 56rpx; font-size: 32rpx; color: #333; }
.count-num { font-size: 32rpx; font-weight: 600; color: #333; min-width: 48rpx; text-align: center; }

.action-bar { display: flex; align-items: center; padding: 16rpx 24rpx; background: #fff; border-top: 1rpx solid #eef0f3; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); }
.action-info { flex: 1; }
.info-count { font-size: 22rpx; color: #999; display: block; }
.info-detail { font-size: 26rpx; color: #333; font-weight: 500; }
.confirm-btn { padding: 20rpx 48rpx; background: linear-gradient(135deg, #FF6B35, #FF3B3B); border-radius: 44rpx; }
.confirm-text { font-size: 30rpx; font-weight: 600; color: #fff; }
</style>
