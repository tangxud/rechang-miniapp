<template>
  <view class="post-page">
    <view class="nav-bar"><text class="nav-back" @tap="goBack">‹</text><text class="nav-title">写评价</text><text class="nav-publish" @tap="onSubmit">发布</text></view>

    <scroll-view scroll-y class="content">
      <view class="card">
        <text class="card-title">给演出打分</text>
        <view class="rating-row">
          <text v-for="i in 5" :key="i" class="star-btn" :class="{ filled: i <= rating }" @tap="rating = i">★</text>
        </view>
        <text v-if="rating" class="rating-desc">{{ ratingDesc[rating - 1] }}</text>
      </view>

      <view class="card">
        <text class="card-title">选择标签（可多选）</text>
        <view class="tag-grid">
          <view v-for="tag in PRESET_TAGS" :key="tag" class="tag-chip" :class="{ active: selectedTags.includes(tag) }" @tap="toggleTag(tag)">
            <text class="tag-chip-text">{{ tag }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="card-title">说点什么吧</text>
        <textarea class="content-input" v-model="content" placeholder="分享你的观演感受，帮助其他人做出决定..." maxlength="2000" />
        <text class="char-count">{{ content.length }}/2000</text>
      </view>

      <view class="card">
        <text class="card-title">添加图片（最多 6 张）</text>
        <view class="image-grid">
          <image v-for="(img, i) in images" :key="i" class="preview-image" :src="img" mode="aspectFill" @tap="removeImage(i)" />
          <view v-if="images.length < 6" class="add-image" @tap="addImage">
            <text class="add-icon">+</text>
            <text class="add-text">{{ images.length }}/6</text>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="anon-row">
          <text class="anon-label">匿名评价</text>
          <switch :checked="isAnonymous" @change="isAnonymous = $event.detail.value" color="#FF6B35" />
        </view>
      </view>
      <view class="bottom-placeholder"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { submitReview } from '../../api/review'

const PRESET_TAGS = ['视野好', '音响棒', '氛围热烈', '交通方便', '歌单惊喜', '值得票价', '演技精湛', '经典重现', '互动性强', '服化道赞']
const ratingDesc = ['很差，不推荐', '一般，有遗憾', '还行，可以一看', '不错，值得推荐', '超棒，强烈推荐！']

const perfId = ref(0)
const rating = ref(0)
const selectedTags = ref<string[]>([])
const content = ref('')
const images = ref<string[]>([])
const isAnonymous = ref(false)

onLoad((options: any) => {
  perfId.value = Number(options?.perfId || 0)
})

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

function addImage() {
  uni.chooseImage({
    count: 6 - images.value.length,
    sizeType: ['compressed'],
    success: (res) => {
      const tempFiles = res.tempFilePaths || []
      images.value = images.value.concat(tempFiles).slice(0, 6)
    }
  })
}

function removeImage(idx: number) {
  uni.showModal({
    title: '移除图片',
    content: '确定移除该图片吗？',
    success: (res) => {
      if (res.confirm) images.value.splice(idx, 1)
    }
  })
}

async function onSubmit() {
  if (rating.value === 0) {
    uni.showToast({ title: '请先给演出打分', icon: 'none' })
    return
  }
  if (!content.value.trim() && selectedTags.value.length === 0) {
    uni.showToast({ title: '请填写评价内容或选择标签', icon: 'none' })
    return
  }

  try {
    await submitReview(perfId.value, {
      rating: rating.value,
      tags: selectedTags.value,
      content: content.value.trim(),
      images: images.value,
      isAnonymous: isAnonymous.value
    })
    uni.showToast({ title: '评价已发布', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1000)
  } catch (e) {}
}

function goBack() { uni.navigateBack() }
</script>

<style scoped>
.post-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }
.nav-bar { display: flex; align-items: center; gap: 16rpx; padding: 0 24rpx; height: 88rpx; background: #fff; border-bottom: 1rpx solid #eef0f3; }
.nav-back { font-size: 48rpx; color: #222; }
.nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #222; }
.nav-publish { font-size: 28rpx; color: #FF6B35; font-weight: 600; padding: 8rpx 16rpx; }
.content { flex: 1; }
.card { margin: 24rpx; padding: 24rpx; background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.card-title { font-size: 28rpx; font-weight: 600; color: #222; display: block; margin-bottom: 16rpx; }

.rating-row { display: flex; flex-direction: row; gap: 16rpx; }
.star-btn { font-size: 56rpx; color: #ddd; }
.star-btn.filled { color: #FFB400; }
.rating-desc { font-size: 24rpx; color: #999; display: block; margin-top: 12rpx; }

.tag-grid { display: flex; flex-direction: row; flex-wrap: wrap; gap: 16rpx; }
.tag-chip { padding: 12rpx 24rpx; background: #f5f5f5; border-radius: 32rpx; border: 2rpx solid transparent; }
.tag-chip.active { background: #fff4e6; border-color: #FF6B35; }
.tag-chip-text { font-size: 26rpx; color: #666; }
.tag-chip.active .tag-chip-text { color: #FF6B35; }

.content-input { width: 100%; min-height: 200rpx; font-size: 28rpx; color: #333; line-height: 1.6; padding: 16rpx; box-sizing: border-box; background: #fafafa; border-radius: 8rpx; }
.char-count { font-size: 22rpx; color: #bbb; display: block; text-align: right; margin-top: 8rpx; }

.image-grid { display: flex; flex-direction: row; flex-wrap: wrap; gap: 12rpx; }
.preview-image { width: 200rpx; height: 200rpx; border-radius: 8rpx; }
.add-image { width: 200rpx; height: 200rpx; border: 2rpx dashed #ddd; border-radius: 8rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.add-icon { font-size: 48rpx; color: #ccc; }
.add-text { font-size: 22rpx; color: #999; margin-top: 8rpx; }

.anon-row { display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
.anon-label { font-size: 28rpx; color: #333; }

.bottom-placeholder { height: 80rpx; }
</style>
