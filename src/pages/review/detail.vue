<template>
  <view class="detail-page">
    <view class="nav-bar"><text class="nav-back" @tap="goBack">‹</text><text class="nav-title">评价详情</text></view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <scroll-view v-if="review" scroll-y class="content" @scrolltolower="loadMoreReplies">
      <view class="review-card">
        <view class="review-header">
          <image v-if="review.userAvatar" class="user-avatar" :src="review.userAvatar" mode="aspectFill" />
          <view v-else class="user-avatar default-avatar"><text class="avatar-text">{{ review.userNickname?.charAt(0) || '匿' }}</text></view>
          <view class="user-info">
            <text class="user-nickname">{{ review.userNickname }}</text>
            <view class="rating-stars">
              <text v-for="i in 5" :key="i" class="star" :class="{ filled: i <= (review.rating || 0) }">★</text>
            </view>
          </view>
          <view v-if="review.siteCity" class="site-tag"><text class="site-text">{{ review.siteCity }}站</text></view>
        </view>
        <text v-if="review.content" class="review-content">{{ review.content }}</text>
        <view v-if="review.images && review.images.length" class="image-grid">
          <image v-for="(img, i) in review.images" :key="i" class="review-image" :src="img" mode="aspectFill" @tap="previewImage(review.images, i)" />
        </view>
        <view v-if="review.tags && review.tags.length" class="review-tag-row">
          <view v-for="(tag, i) in review.tags" :key="i" class="review-tag"><text class="review-tag-text">{{ tag }}</text></view>
        </view>
        <view class="review-footer">
          <view class="footer-btn" @tap="onHelpful">
            <text class="footer-icon" :class="{ active: review.isHelpful }">{{ review.isHelpful ? '❤️' : '🤍' }}</text>
            <text class="footer-text">{{ review.helpfulCount || 0 }}</text>
          </view>
          <view v-if="review.isMine" class="footer-btn danger" @tap="onDelete"><text class="footer-icon">🗑️</text><text class="footer-text">删除</text></view>
          <view v-else class="footer-btn" @tap="onReport"><text class="footer-icon">⚠️</text><text class="footer-text">举报</text></view>
        </view>
        <text class="review-time">{{ formatTime(review.createdAt) }}</text>
      </view>

      <view class="replies-section">
        <text class="section-title">回复 {{ review.replyCount || 0 }}</text>
        <view v-for="r in replies" :key="r.replyId" class="reply-item">
          <image v-if="r.userAvatar" class="reply-avatar" :src="r.userAvatar" mode="aspectFill" />
          <view v-else class="reply-avatar default-avatar"><text class="avatar-text">{{ r.userNickname?.charAt(0) || '热' }}</text></view>
          <view class="reply-body">
            <view class="reply-head">
              <text class="reply-name">{{ r.userNickname }}{{ r.isMine ? ' (我)' : '' }}</text>
              <text class="reply-time">{{ formatTime(r.createdAt) }}</text>
            </view>
            <text class="reply-content">{{ r.content }}</text>
          </view>
        </view>
        <view v-if="loadingMore" class="loading-more"><text>加载中...</text></view>
        <view v-else-if="!hasMore && replies.length" class="no-more"><text>没有更多回复了</text></view>
        <view v-else-if="!replies.length" class="no-reply"><text class="no-reply-text">还没有回复，来说点什么吧</text></view>
      </view>
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <view v-if="review" class="reply-bar">
      <input class="reply-input" v-model="replyContent" placeholder="写回复..." confirm-type="send" @confirm="onSubmitReply" />
      <view class="reply-btn" @tap="onSubmitReply"><text class="reply-btn-text">发送</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getReviewList, toggleHelpful, deleteReview, getReplies, submitReply, reportReview } from '../../api/review'

const reviewId = ref(0)
const perfId = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const review = ref<any>(null)
const replies = ref<any[]>([])
const replyContent = ref('')
const page = ref(1)
const size = 20
const hasMore = ref(true)

onLoad((options: any) => {
  reviewId.value = Number(options?.id || 0)
  perfId.value = Number(options?.perfId || 0)
  if (reviewId.value) loadAll()
})

onShow(() => {
  if (reviewId.value && review.value) {
    refreshReplies()
  }
})

async function loadAll() {
  loading.value = true
  try {
    const listData: any = await getReviewList(perfId.value, 'HELPFUL', 1, 100)
    review.value = (listData.list || []).find((r: any) => r.reviewId === reviewId.value) || null
    await refreshReplies()
  } catch (e) {} finally {
    loading.value = false
  }
}

async function refreshReplies() {
  page.value = 1
  hasMore.value = true
  try {
    const data: any = await getReplies(reviewId.value, page.value, size)
    replies.value = data.list || []
    hasMore.value = replies.value.length < (data.total || 0)
  } catch (e) {}
}

async function loadMoreReplies() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    page.value++
    const data: any = await getReplies(reviewId.value, page.value, size)
    replies.value = replies.value.concat(data.list || [])
    hasMore.value = replies.value.length < (data.total || 0)
  } finally {
    loadingMore.value = false
  }
}

async function onHelpful() {
  if (!review.value) return
  try {
    const res: any = await toggleHelpful(reviewId.value)
    review.value.isHelpful = !!res.isHelpful
    review.value.helpfulCount = (review.value.helpfulCount || 0) + (review.value.isHelpful ? 1 : -1)
  } catch (e) {}
}

async function onSubmitReply() {
  if (!replyContent.value.trim()) return
  try {
    await submitReply(reviewId.value, replyContent.value.trim())
    replyContent.value = ''
    uni.showToast({ title: '已回复', icon: 'none' })
    refreshReplies()
    if (review.value) review.value.replyCount = (review.value.replyCount || 0) + 1
  } catch (e) {}
}

function onDelete() {
  uni.showModal({
    title: '删除评价',
    content: '删除后不可重新评价，确定删除吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await deleteReview(reviewId.value)
        uni.showToast({ title: '已删除', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 800)
      } catch (e) {}
    }
  })
}

function onReport() {
  uni.showActionSheet({
    itemList: ['垃圾广告', '人身攻击', '虚假信息', '其他'],
    success: async (res) => {
      const types = ['SPAM', 'ABUSE', 'FALSE', 'OTHER']
      try {
        await reportReview(reviewId.value, types[res.tapIndex], '')
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
.detail-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.nav-bar { display: flex; align-items: center; gap: 16rpx; padding: 0 24rpx; height: 88rpx; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.nav-back { font-size: 48rpx; color: #222; }
.nav-title { font-size: 32rpx; font-weight: 600; color: #222; }
.loading { text-align: center; padding: 120rpx 0; font-size: 28rpx; color: #999; }

.content { flex: 1; }
.review-card { margin: 24rpx; padding: 24rpx; background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.review-header { display: flex; flex-direction: row; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.user-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #f0f0f0; flex-shrink: 0; }
.default-avatar { display: flex; align-items: center; justify-content: center; background: #FF6B35; }
.avatar-text { font-size: 28rpx; color: #fff; font-weight: 600; }
.user-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.user-nickname { font-size: 26rpx; color: #333; font-weight: 600; }
.rating-stars { display: flex; flex-direction: row; }
.star { font-size: 22rpx; color: #ddd; }
.star.filled { color: #FFB400; }
.site-tag { padding: 4rpx 12rpx; background: #f5f5f5; border-radius: 8rpx; }
.site-text { font-size: 20rpx; color: #999; }
.review-content { font-size: 28rpx; color: #333; line-height: 1.7; display: block; margin-bottom: 16rpx; }
.image-grid { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8rpx; margin-bottom: 16rpx; }
.review-image { width: 200rpx; height: 200rpx; border-radius: 8rpx; }
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

.replies-section { margin: 0 24rpx; padding: 24rpx; background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.section-title { font-size: 28rpx; font-weight: 600; color: #222; display: block; margin-bottom: 16rpx; }
.reply-item { display: flex; flex-direction: row; gap: 16rpx; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.reply-item:last-child { border-bottom: none; }
.reply-avatar { width: 56rpx; height: 56rpx; border-radius: 50%; background: #f0f0f0; flex-shrink: 0; }
.reply-body { flex: 1; }
.reply-head { display: flex; flex-direction: row; justify-content: space-between; align-items: baseline; margin-bottom: 6rpx; }
.reply-name { font-size: 24rpx; color: #333; font-weight: 600; }
.reply-time { font-size: 20rpx; color: #bbb; }
.reply-content { font-size: 26rpx; color: #555; line-height: 1.6; display: block; }

.loading-more, .no-more, .no-reply { text-align: center; padding: 24rpx 0; font-size: 22rpx; color: #999; }
.no-reply-text { color: #999; }
.bottom-placeholder { height: 140rpx; }

.reply-bar { display: flex; flex-direction: row; align-items: center; gap: 16rpx; padding: 16rpx 24rpx; background: #fff; border-top: 1rpx solid #eef0f3; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); }
.reply-input { flex: 1; height: 64rpx; padding: 0 20rpx; background: #f5f5f5; border-radius: 32rpx; font-size: 26rpx; }
.reply-btn { padding: 12rpx 24rpx; background: linear-gradient(135deg, #FF6B35, #FF3B3B); border-radius: 32rpx; }
.reply-btn-text { font-size: 24rpx; color: #fff; font-weight: 600; }
</style>
