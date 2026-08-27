<template>
  <view class="search-page">
    <view class="search-bar">
      <view class="input-wrap">
        <text class="icon">🔍</text>
        <input
          class="input"
          v-model="keyword"
          placeholder="搜索演出、艺人、场馆"
          :focus="true"
          confirm-type="search"
          @input="onInput"
          @confirm="onSearch"
        />
        <text v-if="keyword" class="clear" @tap="clearInput">✕</text>
      </view>
      <text class="search-btn" @tap="onSearch">搜索</text>
    </view>

    <view class="content">
      <!-- Suggestions when typing -->
      <view v-if="keyword && suggestions.length" class="suggest-section">
        <view
          v-for="(s, i) in suggestions"
          :key="i"
          class="suggest-item"
          @tap="goResult(s.text)"
        >
          <text class="suggest-icon">🔍</text>
          <text class="suggest-text">{{ s.text }}</text>
        </view>
      </view>

      <!-- No suggestion found -->
      <view v-else-if="keyword && !suggestions.length && searched" class="no-suggest">
        <text class="no-suggest-text">未找到“{{ keyword }}”相关内容</text>
      </view>

      <!-- Hot keywords when input empty -->
      <view v-if="!keyword && hotKeywords.length" class="hot-section">
        <text class="section-title">热门搜索</text>
        <view class="hot-tags">
          <view
            v-for="(k, i) in hotKeywords"
            :key="i"
            class="hot-tag"
            :class="{ 'hot-top': i < 3 }"
            @tap="goResult(k)"
          >
            <text class="hot-rank">{{ i + 1 }}</text>
            <text class="hot-tag-text">{{ k }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { searchSuggest } from '../../api/home'

const keyword = ref('')
const suggestions = ref<any[]>([])
const hotKeywords = ref<string[]>([])
const searched = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function normalizeSuggestions(res: any): any[] {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.suggestions)) return res.suggestions
  return []
}

function normalizeHot(res: any): string[] {
  if (!res) return []
  if (Array.isArray(res.hot_keywords)) return res.hot_keywords
  if (Array.isArray(res)) return res.map((s: any) => (typeof s === 'string' ? s : s.text)).filter(Boolean)
  return []
}

async function loadHot() {
  try {
    const res: any = await searchSuggest('')
    hotKeywords.value = normalizeHot(res)
  } catch (e) {
    hotKeywords.value = []
  }
}

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!keyword.value) {
    suggestions.value = []
    searched.value = false
    return
  }
  debounceTimer = setTimeout(async () => {
    try {
      const res: any = await searchSuggest(keyword.value)
      suggestions.value = normalizeSuggestions(res)
    } catch (e) {
      suggestions.value = []
    } finally {
      searched.value = true
    }
  }, 300)
}

function clearInput() {
  keyword.value = ''
  suggestions.value = []
  searched.value = false
}

function onSearch() {
  if (!keyword.value.trim()) {
    uni.showToast({ title: '请输入搜索内容', icon: 'none' })
    return
  }
  goResult(keyword.value.trim())
}

function goResult(kw: string) {
  uni.navigateTo({ url: `/pages/home/search-result?keyword=${encodeURIComponent(kw)}` })
}

onLoad(() => {
  loadHot()
})
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #fff;
}
.search-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #eee;
}
.input-wrap {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 24rpx;
}
.icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}
.input {
  flex: 1;
  font-size: 28rpx;
  color: #222;
}
.clear {
  font-size: 28rpx;
  color: #ccc;
  padding: 8rpx;
}
.search-btn {
  font-size: 30rpx;
  color: #FF6B35;
  font-weight: 600;
  margin-left: 24rpx;
}
.content {
  padding: 24rpx;
}
.suggest-section {
  background: #fff;
}
.suggest-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.suggest-icon {
  font-size: 28rpx;
  margin-right: 16rpx;
}
.suggest-text {
  font-size: 28rpx;
  color: #333;
}
.no-suggest {
  padding: 80rpx 0;
  text-align: center;
}
.no-suggest-text {
  font-size: 28rpx;
  color: #999;
}
.hot-section {
  margin-top: 16rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
  margin-bottom: 24rpx;
}
.hot-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.hot-tag {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 14rpx 28rpx;
  background: #f5f5f5;
  border-radius: 32rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
}
.hot-tag.hot-top {
  background: #fff0eb;
}
.hot-rank {
  font-size: 24rpx;
  font-weight: 700;
  color: #FF6B35;
  margin-right: 10rpx;
}
.hot-tag-text {
  font-size: 26rpx;
  color: #333;
}
</style>
