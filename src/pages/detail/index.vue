<template>
  <view class="detail">
    <view v-if="loading && !detail" class="loading"><text>加载中...</text></view>

    <template v-if="detail">
      <!-- Poster -->
      <image class="poster" :src="detail.posterUrl || placeholder" mode="aspectFill" />

      <!-- Countdown banner -->
      <view v-if="cdSeconds > 0" class="cd-banner">
        <text class="cd-banner-label">距开票还有</text>
        <Countdown :seconds="cdSeconds" />
      </view>

      <!-- Basic info -->
      <view class="info-card">
        <view class="name-row">
          <text v-if="typeLabel" class="type-badge">{{ typeLabel }}</text>
          <text class="perf-name">{{ detail.name }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">时间</text>
          <text class="info-value">{{ formatDateTime(detail.startAt) }}</text>
        </view>
        <view v-if="detail.endAt" class="info-row">
          <text class="info-label">结束</text>
          <text class="info-value">{{ formatDateTime(detail.endAt) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">场馆</text>
          <text class="info-value">{{ detail.venue?.venueName || '待定' }}</text>
        </view>
        <view v-if="detail.artist?.artistName" class="info-row">
          <text class="info-label">艺人</text>
          <text class="info-value">{{ detail.artist.artistName }}</text>
        </view>
        <view v-if="detail.tourName" class="info-row">
          <text class="info-label">巡演</text>
          <text class="info-value">{{ detail.tourName }}</text>
        </view>
        <view v-if="detail.isStrongRealName" class="realname-tip">
          <text class="realname-tip-text">本场演出需强实名认证，入场需人脸核验</text>
        </view>
      </view>

      <!-- Price zones -->
      <view v-if="priceZones.length" class="section-card">
        <text class="card-title">票价区域</text>
        <view v-for="(zone, i) in priceZones" :key="i" class="zone-row">
          <view class="zone-left">
            <text class="zone-name">{{ zone.zoneName || zone.region }}</text>
            <text v-if="zone.totalCount != null" class="zone-count">余票 {{ zone.totalCount }}</text>
          </view>
          <text class="zone-price">{{ formatPrice(zone.price) }}</text>
        </view>
      </view>

      <!-- Description -->
      <view v-if="detail.description" class="section-card">
        <text class="card-title">演出介绍</text>
        <text class="desc-text">{{ detail.description }}</text>
      </view>

      <!-- Review summary -->
      <view class="section-card" @tap="goReviewList">
        <view class="card-header">
          <text class="card-title">口碑评价</text>
          <text v-if="reviewSummary && reviewSummary.totalReviews > 0" class="card-more">查看全部 ›</text>
        </view>
        <view v-if="reviewSummary && reviewSummary.totalReviews >= 50" class="review-summary">
          <view class="rating-row">
            <text class="rating-num">{{ reviewSummary.avgRating?.toFixed(1) || '0.0' }}</text>
            <view class="rating-stars">
              <text v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(reviewSummary.avgRating || 0) }">★</text>
            </view>
            <text class="rating-total">{{ reviewSummary.totalReviews }} 条评价</text>
          </view>
          <view v-if="reviewTags.length" class="tag-row">
            <view v-for="(tag, i) in reviewTags" :key="i" class="review-tag">
              <text class="review-tag-text">{{ typeof tag === 'string' ? tag : tag.tag }}</text>
            </view>
          </view>
        </view>
        <view v-else class="review-empty">
          <text class="review-empty-text">口碑建设中，点击查看评价</text>
        </view>
      </view>

      <view class="bottom-placeholder"></view>
    </template>

    <!-- Bottom action bar -->
    <view v-if="detail" class="action-bar">
      <view class="action-left">
        <view class="action-icon-btn" @tap="onWant">
          <text class="action-icon">{{ isWanted ? '❤️' : '🤍' }}</text>
          <text class="action-icon-text">想看 {{ wantCount }}</text>
        </view>
        <view class="action-icon-btn" @tap="onSubscribe">
          <text class="action-icon">{{ isSubscribed ? '🔔' : '🔕' }}</text>
          <text class="action-icon-text">{{ isSubscribed ? '已订阅' : '开票提醒' }}</text>
        </view>
      </view>
      <view class="buy-btn" @tap="onBuy">
        <text class="buy-btn-text">选座购票</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getShowDetail, toggleWant, toggleSubscribe } from '../../api/show'
import { CountdownWS } from '../../utils/websocket'
import Countdown from '../../components/countdown.vue'

const placeholder = 'https://cdn.rechang.com/placeholder.jpg'

const TYPE_LABELS: Record<string, string> = {
  CONCERT: '演唱会',
  DRAMA: '话剧',
  SPORT: '体育',
  EXHIBITION: '展览'
}

const perfId = ref(0)
const detail = ref<any>(null)
const loading = ref(false)
const isWanted = ref(false)
const wantCount = ref(0)
const isSubscribed = ref(false)
const cdSeconds = ref(0)
let ws: CountdownWS | null = null

const typeLabel = computed(() => TYPE_LABELS[detail.value?.showType] || '')
const priceZones = computed(() => detail.value?.priceZones || [])
const reviewSummary = computed(() => detail.value?.reviewSummary || null)
const reviewTags = computed(() => reviewSummary.value?.topTags || [])

async function loadDetail() {
  loading.value = true
  try {
    const data: any = await getShowDetail(perfId.value)
    detail.value = data
    isWanted.value = !!data.isWanted
    wantCount.value = data.wantCount || 0
    initCountdown(data.saleStartTime)
  } catch (e) {
    // error handled by request util
  } finally {
    loading.value = false
  }
}

function initCountdown(saleStartTime: string) {
  if (!saleStartTime) return
  const target = new Date(saleStartTime).getTime()
  if (isNaN(target)) return
  const diff = Math.floor((target - Date.now()) / 1000)
  if (diff > 0) {
    cdSeconds.value = diff
    ws = new CountdownWS(perfId.value, (data: any) => {
      const s = data.countdownSeconds  // 后端 CountdownWebSocketHandler 的字段名
      if (typeof s === 'number' && s >= 0) cdSeconds.value = s
    })
    ws.connect()
  }
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '待定'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}`
}

function formatPrice(cents: number) {
  if (cents == null || cents <= 0) return '待定'
  const yuan = cents / 100
  return '¥' + (Number.isInteger(yuan) ? yuan : yuan.toFixed(2))
}

async function onWant() {
  try {
    await toggleWant(perfId.value)
    isWanted.value = !isWanted.value
    wantCount.value += isWanted.value ? 1 : -1
    uni.showToast({ title: isWanted.value ? '已加入想看' : '已取消想看', icon: 'none' })
  } catch (e) {
    // error handled by request util
  }
}

async function onSubscribe() {
  try {
    await toggleSubscribe(perfId.value, 'ON_SALE')
    isSubscribed.value = !isSubscribed.value
    uni.showToast({
      title: isSubscribed.value ? '已订阅开票提醒' : '已取消订阅',
      icon: 'none'
    })
  } catch (e) {
    // error handled by request util
  }
}

function onBuy() {
  if (!detail.value) return
  uni.navigateTo({ url: `/pages/seat/index?id=${perfId.value}` })
}

function goReviewList() {
  uni.navigateTo({ url: `/pages/review/list?id=${perfId.value}` })
}

onLoad((options: any) => {
  perfId.value = Number(options?.id || 0)
  if (perfId.value) loadDetail()
})

onUnmounted(() => {
  ws?.close()
})
</script>

<style scoped>
.detail {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}
.loading {
  text-align: center;
  padding: 120rpx 0;
  font-size: 28rpx;
  color: #999;
}
.poster {
  width: 100%;
  height: 500rpx;
  background: #f0f0f0;
}
.cd-banner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 16rpx 24rpx;
  background: #fff0eb;
}
.cd-banner-label {
  font-size: 26rpx;
  color: #FF6B35;
  margin-right: 12rpx;
}
.info-card {
  margin: 24rpx;
  padding: 28rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.name-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 20rpx;
}
.type-badge {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #FF6B35;
  border: 1rpx solid #FF6B35;
  border-radius: 6rpx;
  padding: 2rpx 12rpx;
  margin-right: 16rpx;
  line-height: 1.4;
}
.perf-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #222;
  flex: 1;
}
.info-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 12rpx 0;
}
.info-label {
  font-size: 26rpx;
  color: #999;
  width: 80rpx;
  flex-shrink: 0;
}
.info-value {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}
.realname-tip {
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  background: #fff4e6;
  border-radius: 8rpx;
}
.realname-tip-text {
  font-size: 24rpx;
  color: #FF6B35;
}
.section-card {
  margin: 24rpx;
  padding: 28rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
  margin-bottom: 20rpx;
}
.card-header { display: flex; flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.card-header .card-title { margin-bottom: 0; }
.card-more { font-size: 24rpx; color: #999; }
.zone-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.zone-row:last-child {
  border-bottom: none;
}
.zone-left {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.zone-name {
  font-size: 28rpx;
  color: #333;
}
.zone-count {
  font-size: 22rpx;
  color: #999;
  margin-left: 16rpx;
}
.zone-price {
  font-size: 30rpx;
  font-weight: 700;
  color: #FF6B35;
}
.desc-text {
  font-size: 28rpx;
  color: #555;
  line-height: 1.7;
}
.review-summary {
  display: flex;
  flex-direction: column;
}
.rating-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-bottom: 20rpx;
}
.rating-num {
  font-size: 56rpx;
  font-weight: 700;
  color: #FF6B35;
}
.rating-stars { display: flex; flex-direction: row; margin-left: 12rpx; }
.star { font-size: 28rpx; color: #ddd; }
.star.filled { color: #FFB400; }
.rating-total {
  font-size: 24rpx;
  color: #999;
  margin-left: 16rpx;
}
.tag-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.review-tag {
  padding: 8rpx 20rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  margin-right: 16rpx;
  margin-bottom: 12rpx;
}
.review-tag-text {
  font-size: 24rpx;
  color: #666;
}
.review-empty {
  padding: 40rpx 0;
  text-align: center;
}
.review-empty-text {
  font-size: 28rpx;
  color: #999;
}
.bottom-placeholder {
  height: 140rpx;
}
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #fff;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}
.action-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 24rpx;
}
.action-icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 36rpx;
}
.action-icon {
  font-size: 40rpx;
}
.action-icon-text {
  font-size: 20rpx;
  color: #666;
  margin-top: 4rpx;
}
.buy-btn {
  flex: 1;
  height: 88rpx;
  background: linear-gradient(135deg, #FF6B35, #FF3B3B);
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.buy-btn-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}
</style>
