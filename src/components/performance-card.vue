<template>
  <view class="perf-card" @tap="goDetail">
    <image class="poster" :src="poster" mode="aspectFill" />
    <view class="info">
      <view class="name-row">
        <text v-if="typeLabel" class="type-badge">{{ typeLabel }}</text>
        <text class="name">{{ displayName }}</text>
      </view>
      <text class="date">{{ displayDate }}</text>
      <view class="meta">
        <text class="city">{{ city || '城市待定' }}</text>
        <text v-if="venue" class="venue">· {{ venue }}</text>
      </view>
      <view class="bottom">
        <text class="price">{{ priceText }}</text>
        <view v-if="isHot" class="hot-badge">
          <text class="hot-text">🔥 热销</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ item: any }>()

const TYPE_LABELS: Record<string, string> = {
  CONCERT: '演唱会',
  DRAMA: '话剧',
  SPORT: '体育',
  EXHIBITION: '展览'
}

const id = computed(() => props.item?.performance_id || props.item?.id)
const displayName = computed(() => props.item?.name || '未知演出')
const poster = computed(() => props.item?.poster_url || 'https://cdn.rechang.com/placeholder.jpg')
const startAt = computed(() => props.item?.start_at || '')
const minPrice = computed(() => props.item?.min_price)
const city = computed(() => props.item?.city || '')
const venue = computed(() => props.item?.venue_name || '')
const showType = computed(() => props.item?.show_type || '')
const isHot = computed(() => !!props.item?.is_hot_sale)

const typeLabel = computed(() => TYPE_LABELS[showType.value] || showType.value || '')

const displayDate = computed(() => {
  if (!startAt.value) return '时间待定'
  const d = new Date(startAt.value)
  if (isNaN(d.getTime())) return startAt.value
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}`
})

const priceText = computed(() => {
  const cents = minPrice.value
  if (cents == null || cents <= 0) return '价格待定'
  const yuan = cents / 100
  return '¥' + (Number.isInteger(yuan) ? yuan : yuan.toFixed(2)) + ' 起'
})

function goDetail() {
  if (!id.value) return
  uni.navigateTo({ url: `/pages/detail/index?id=${id.value}` })
}
</script>

<style scoped>
.perf-card {
  display: flex;
  flex-direction: row;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 20rpx;
}
.poster {
  width: 200rpx;
  height: 268rpx;
  flex-shrink: 0;
  background: #f0f0f0;
}
.info {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}
.name-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.type-badge {
  flex-shrink: 0;
  font-size: 20rpx;
  color: #FF6B35;
  border: 1rpx solid #FF6B35;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
  margin-right: 12rpx;
  line-height: 1.4;
}
.name {
  font-size: 30rpx;
  font-weight: 600;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.date {
  font-size: 24rpx;
  color: #666;
  margin-top: 12rpx;
}
.meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 8rpx;
}
.city {
  font-size: 24rpx;
  color: #999;
}
.venue {
  font-size: 24rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bottom {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}
.price {
  font-size: 32rpx;
  font-weight: 700;
  color: #FF6B35;
}
.hot-badge {
  background: linear-gradient(135deg, #FF6B35, #FF3B3B);
  border-radius: 20rpx;
  padding: 4rpx 16rpx;
}
.hot-text {
  font-size: 20rpx;
  color: #fff;
}
</style>
