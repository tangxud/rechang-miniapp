<template>
  <view class="review-page">
    <view class="nav-bar"><text class="nav-back" @tap="goBack">‹</text><text class="nav-title">观众口碑</text></view>

    <view v-if="loading && !list.length" class="loading"><text>加载中...</text></view>

    <template v-if="summary">
      <view class="summary-card">
        <view class="rating-row">
          <text class="rating-num">{{ avgRating.toFixed(1) }}</text>
          <view class="rating-stars">
            <text v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(avgRating) }">★</text>
          </view>
          <text class="rating-total">{{ summary.totalCount }} 条评价</text>
        </view>
        <view v-if="topTags.length" class="tag-row">
          <view v-for="(tag, i) in topTags" :key="i" class="tag-pill"><text class="tag-text">{{ tag }}</text></view>
        </view>
        <view v-if="summary.totalCount < 50" class="cold-tip"><text class="cold-tip-text">口碑建设中，仅供参考</text></view>
      </view>

      <view class="sort-bar">
        <text class="sort-btn" :class="{ active: sortBy === 'HELPFUL' }" @tap="switchSort('HELPFUL')">最有帮助</text>
        <text class="sort-btn" :class="{ active: sortBy === 'LATEST' }" @tap="switchSort('LATEST')">最新</text>
      </view>

      <scroll-view scroll-y class="review-list" @scrolltolower="loadMore">
        <view v-for="r in list" :key="r.reviewId" class="review-card">
          <view class="review-header">
            <image v-if="r.userAvatar" class="user-avatar" :src="r.userAvatar" mode="aspectFill" />
            <view v-else class="user-avatar default-avatar"><text class="avatar-text">{{ r.userNickname?.charAt(0) || '匿' }}</text></view>
            <view class="user-info">
              <text class="user-nickname">{{ r.userNickname }}</text>
              <view class="rating-stars small">
                <text v-for="i in 5" :key="i" class="star sm" :class="{ filled: i <= (r.rating || 0) }">★</text>
              </view>
            </view>
            <view v-if="r.siteCity" class="site-tag"><text class="site-text">{{ r.siteCity }}站</text></view>
          </view>
          <text v-if="r.content" class="review-content">{{ r.content }}</text>
          <view v-if="r.images && r.images.length" class="image-grid">
            <image v-for="(img, i) in r.images" :key="i" class="review-image" :src="img" mode="aspectFill" @tap="previewImage(r.images, i)" />
          </view>
          <view v-if="r.tags && r.tags.length" class="review-tag-row">
            <view v-for="(tag, i) in r.tags" :key="i" class="review-tag"><text class="review-tag-text">{{ tag }}</text></view>
          </view>
          <view class="review-footer">
            <view class="footer-btn" @tap="onHelpful(r)">
              <text class="footer-icon" :class="{ active: r.isHelpful }">{{ r.isHelpful ? '❤️' : '🤍' }}</text>
              <text class="footer-text">{{ r.helpfulCount || 0 }}</text>
            </view>
            <view class="footer-btn" @tap="goDetail(r)">
              <text class="footer-icon">💬</text>
              <text class="footer-text">{{ r.replyCount || 0 }}</text>
            </view>
            <view v-if="r.isMine" class="footer-btn danger" @tap="onDelete(r)"><text class="footer-icon">🗑️</text><text class="footer-text">删除</text></view>
            <view v-else class="footer-btn" @tap="onReport(r)"><text class="footer-icon">⚠️</text><text class="footer-text">举报</text></view>
          </view>
          <text class="review-time">{{ formatTime(r.createdAt) }}</text>
        </view>
        <view v-if="loadingMore" class="loading-more"><text>加载中...</text></view>
        <view v-else-if="!hasMore && list.length" class="no-more"><text>没有更多评价了</text></view>
        <view v-else-if="!list.length" class="empty"><text class="empty-text">还没有评价，期待第一条口碑</text></view>
        <view class="bottom-placeholder"></view>
      </scroll-view>

      <view v-if="canReview" class="action-bar">
        <view class="write-btn" @tap="goPostReview"><text class="write-btn-text">写评价</text></view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getReviewList, toggleHelpful, deleteReview } from '../../api/review'
import { getShowDetail } from '../../api/show'

const perfId = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const summary = ref<any>(null)
const list = ref<any[]>([])
const sortBy = ref('HELPFUL')
const page = ref(1)
const size = 10
const hasMore = ref(true)
const perfEnded = ref(false)

const avgRating = computed(() => summary.value?.avgRating ? Number(summary.value.avgRating) : 0)
const topTags = computed(() => (summary.value?.topTags || []).map((t: any) => typeof t === 'string' ? t : t.tag))
const canReview = computed(() => perfEnded.value)

onLoad((options: any) => {
  perfId.value = Number(options?.id || 0)
  if (perfId.value) {
    loadAll()
    loadPerfStatus()
  }
})

onShow(() => {
  if (perfId.value && list.value.length) {
    refresh()
  }
})

async function loadAll() {
  loading.value = true
  try { await fetchPage(true) } finally { loading.value = false }
}

async function refresh() {
  page.value = 1
  hasMore.value = true
  await fetchPage(true)
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    page.value++
    await fetchPage(false)
  } finally {
    loadingMore.value = false
  }
}

async function fetchPage(reset: boolean) {
  try {
    const data: any = await getReviewList(perfId.value, sortBy.value, page.value, size)
    if (reset) {
      list.value = data.list || []
      summary.value = data.summary
    } else {
      list.value = list.value.concat(data.list || [])
    }
    hasMore.value = list.value.length < (data.total || 0)
  } catch (e) {}
}

async function loadPerfStatus() {
  try {
    const d: any = await getShowDetail(perfId.value)
    perfEnded.value = d.endAt && new Date(d.endAt).getTime() < Date.now()
  } catch (e) {}
}

function switchSort(s: string) {
  if (sortBy.value === s) return
  sortBy.value = s
  refresh()
}

async function onHelpful(r: any) {
  try {
    const res: any = await toggleHelpful(r.reviewId)
    r.isHelpful = !!res.isHelpful
    r.helpfulCount = (r.helpfulCount || 0) + (r.isHelpful ? 1 : -1)
  } catch (e) {}
}

function goDetail(r: any) {
  uni.navigateTo({ url: `/pages/review/detail?id=${r.reviewId}&perfId=${perfId.value}` })
}

function goPostReview() {
  uni.navigateTo({ url: `/pages/review/post?perfId=${perfId.value}` })
}

function onDelete(r: any) {
  uni.showModal({
    title: '删除评价',
    content: '删除后不可重新评价，确定删除吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await deleteReview(r.reviewId)
        uni.showToast({ title: '已删除', icon: 'none' })
        refresh()
      } catch (e) {}
    }
  })
}

function onReport(r: any) {
  uni.showActionSheet({
    itemList: ['垃圾广告', '人身攻击', '虚假信息', '其他'],
    success: async (res) => {
      const types = ['SPAM', 'ABUSE', 'FALSE', 'OTHER']
      try {
        const { reportReview } = await import('../../api/review')
        await reportReview(r.reviewId, types[res.tapIndex], '')
        uni.showToast({ title: '已举报，待审核', icon: 'none' })
      } catch (e) {}
    }
  })
}

function previewImage(urls: string[], current: number) {
  uni.previewImage({ urls, current: urls[current] })
}

function formatTime(t: string) {
  if (!t) return ''
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

function goBack() { uni.navigateBack() }
</script>

<style scoped>
.review-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.nav-bar { display: flex; align-items: center; gap: 16rpx; padding: 0 24rpx; height: 88rpx; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.nav-back { font-size: 48rpx; color: #222; }
.nav-title { font-size: 32rpx; font-weight: 600; color: #222; }
.loading { text-align: center; padding: 120rpx 0; font-size: 28rpx; color: #999; }

.summary-card { margin: 24rpx; padding: 28rpx; background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.rating-row { display: flex; flex-direction: row; align-items: baseline; gap: 16rpx; margin-bottom: 20rpx; }
.rating-num { font-size: 64rpx; font-weight: 700; color: #FF6B35; }
.rating-stars { display: flex; flex-direction: row; }
.star { font-size: 28rpx; color: #ddd; }
.star.filled { color: #FFB400; }
.star.sm { font-size: 22rpx; }
.rating-total { font-size: 24rpx; color: #999; }
.tag-row { display: flex; flex-direction: row; flex-wrap: wrap; gap: 12rpx; }
.tag-pill { padding: 8rpx 20rpx; background: #fff4e6; border-radius: 24rpx; }
.tag-text { font-size: 24rpx; color: #FF6B35; }
.cold-tip { margin-top: 16rpx; }
.cold-tip-text { font-size: 22rpx; color: #999; }

.sort-bar { display: flex; flex-direction: row; padding: 0 24rpx; gap: 24rpx; margin-bottom: 16rpx; }
.sort-btn { font-size: 26rpx; color: #999; padding: 8rpx 0; }
.sort-btn.active { color: #222; font-weight: 600; border-bottom: 4rpx solid #FF6B35; }

.review-list { flex: 1; }
.review-card { margin: 0 24rpx 24rpx; padding: 24rpx; background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.review-header { display: flex; flex-direction: row; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.user-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #f0f0f0; flex-shrink: 0; }
.default-avatar { display: flex; align-items: center; justify-content: center; background: #FF6B35; }
.avatar-text { font-size: 28rpx; color: #fff; font-weight: 600; }
.user-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.user-nickname { font-size: 26rpx; color: #333; font-weight: 600; }
.site-tag { padding: 4rpx 12rpx; background: #f5f5f5; border-radius: 8rpx; }
.site-text { font-size: 20rpx; color: #999; }
.review-content { font-size: 28rpx; color: #333; line-height: 1.7; display: block; margin-bottom: 16rpx; }
.image-grid { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8rpx; margin-bottom: 16rpx; }
.review-image { width: 200rpx; height: 200rpx; border-radius: 8rpx; background: #f0f0f0; }
.review-tag-row { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8rpx; margin-bottom: 16rpx; }
.review-tag { padding: 4rpx 16rpx; background: #f5f5f5; border-radius: 8rpx; }
.review-tag-text { font-size: 22rpx; color: #666; }
.review-footer { display: flex; flex-direction: row; align-items: center; gap: 32rpx; padding-top: 16rpx; border-top: 1rpx solid #f5f5f5; }
.footer-btn { display: flex; flex-direction: row; align-items: center; gap: 6rpx; }
.footer-icon { font-size: 28rpx; }
.footer-icon.active { color: #FF6B35; }
.footer-text { font-size: 24rpx; color: #999; }
.footer-btn.danger .footer-text { color: #e53935; }
.review-time { font-size: 22rpx; color: #bbb; display: block; margin-top: 12rpx; }

.loading-more, .no-more, .empty { text-align: center; padding: 40rpx 0; font-size: 24rpx; color: #999; }
.empty-text { color: #999; }
.bottom-placeholder { height: 140rpx; }

.action-bar { position: fixed; bottom: 0; left: 0; width: 100%; padding: 16rpx 24rpx; background: #fff; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.08); padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); }
.write-btn { height: 80rpx; background: linear-gradient(135deg, #FF6B35, #FF3B3B); border-radius: 40rpx; display: flex; align-items: center; justify-content: center; }
.write-btn-text { font-size: 28rpx; color: #fff; font-weight: 600; }
</style>
