<template>
  <view class="result-page">
    <view class="result-header">
      <text class="back-btn" @tap="goBack">‹</text>
      <text class="result-title">“{{ keyword }}”的搜索结果</text>
    </view>

    <scroll-view scroll-y class="result-scroll" @scrolltolower="loadMore">
      <view class="result-list">
        <PerformanceCard v-for="item in list" :key="item.performanceId" :item="item" />
      </view>

      <EmptyState v-if="!loading && !list.length" text="未找到相关演出" />

      <view v-if="loading && !list.length" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="loading && list.length" class="loading-more">
        <text>加载更多...</text>
      </view>
      <view v-if="!loading && list.length && noMore" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getShowList } from '../../api/show'
import PerformanceCard from '../../components/performance-card.vue'
import EmptyState from '../../components/empty-state.vue'

const keyword = ref('')
const list = ref<any[]>([])
const page = ref(1)
const size = 20
const total = ref(0)
const loading = ref(false)

const noMore = computed(() => list.value.length >= total.value)

async function loadList(reset = false) {
  if (loading.value) return
  if (reset) {
    page.value = 1
    list.value = []
  }
  loading.value = true
  try {
    const res: any = await getShowList({ keyword: keyword.value, page: page.value, size })
    const items = res.list || []
    list.value = reset ? items : [...list.value, ...items]
    total.value = res.total || 0
  } catch (e) {
    // error handled by request util
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (noMore.value || loading.value) return
  page.value++
  loadList()
}

function goBack() {
  uni.navigateBack()
}

onLoad((options: any) => {
  keyword.value = options?.keyword ? decodeURIComponent(options.keyword) : ''
  loadList(true)
})
</script>

<style scoped>
.result-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}
.result-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 88rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
  padding: 0 24rpx;
}
.back-btn {
  font-size: 48rpx;
  color: #222;
  margin-right: 16rpx;
  line-height: 1;
}
.result-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.result-scroll {
  flex: 1;
  min-height: 0;
}
.result-list {
  padding: 24rpx;
}
.loading,
.loading-more,
.no-more {
  text-align: center;
  padding: 32rpx;
  font-size: 26rpx;
  color: #999;
}
</style>
