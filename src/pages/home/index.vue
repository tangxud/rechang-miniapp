<template>
  <view class="home">
    <!-- Custom nav bar -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <text class="logo">热场</text>
        <view class="search-box" @tap="goSearch">
          <text class="search-icon">🔍</text>
          <text class="search-placeholder">搜索演出、艺人、场馆</text>
        </view>
      </view>
    </view>
    <view :style="{ height: navHeight + 'px' }"></view>

    <!-- Banner -->
    <swiper
      v-if="banners.length"
      class="banner-swiper"
      :indicator-dots="true"
      indicator-active-color="#FF6B35"
      :autoplay="true"
      :interval="4000"
      :circular="true"
    >
      <swiper-item v-for="b in banners" :key="b.id" @tap="onBanner(b)">
        <image class="banner-img" :src="b.image_url || placeholder" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <!-- 即将开票 -->
    <view v-if="upcoming.length" class="section">
      <view class="section-header">
        <text class="section-title">即将开票</text>
      </view>
      <scroll-view scroll-x class="h-scroll" :show-scrollbar="false">
        <view class="h-list">
          <view
            v-for="item in upcoming"
            :key="item.performance_id"
            class="upcoming-card"
            @tap="goDetail(item.performance_id)"
          >
            <image class="upcoming-poster" :src="item.poster_url || placeholder" mode="aspectFill" />
            <text class="upcoming-name">{{ item.name }}</text>
            <view class="upcoming-cd">
              <text class="cd-label">距开票</text>
              <Countdown v-if="cdSeconds(item) > 0" :seconds="cdSeconds(item)" />
              <text v-else class="cd-now">正在售票</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 为你推荐 -->
    <view v-if="recommended.length" class="section">
      <view class="section-header">
        <text class="section-title">为你推荐</text>
      </view>
      <scroll-view scroll-x class="h-scroll" :show-scrollbar="false">
        <view class="h-list">
          <view
            v-for="item in recommended"
            :key="item.performance_id"
            class="rec-card"
            @tap="goDetail(item.performance_id)"
          >
            <image class="rec-poster" :src="item.poster_url || placeholder" mode="aspectFill" />
            <text class="rec-name">{{ item.name }}</text>
            <text class="rec-price">{{ formatPrice(item.min_price) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 热门演出 -->
    <view v-if="hotList.length" class="section">
      <view class="section-header">
        <text class="section-title">热门演出</text>
      </view>
      <PerformanceCard v-for="item in hotList" :key="item.performance_id" :item="item" />
    </view>

    <EmptyState v-if="!loading && !banners.length && !hotList.length" text="暂无演出数据" />
    <view v-if="loading" class="loading"><text>加载中...</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getHomeData } from '../../api/home'
import PerformanceCard from '../../components/performance-card.vue'
import Countdown from '../../components/countdown.vue'
import EmptyState from '../../components/empty-state.vue'

const placeholder = 'https://cdn.rechang.com/placeholder.jpg'
const statusBarHeight = ref(0)
const navHeight = ref(0)

const banners = ref<any[]>([])
const upcoming = ref<any[]>([])
const recommended = ref<any[]>([])
const hotList = ref<any[]>([])
const loading = ref(false)

statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
navHeight.value = statusBarHeight.value + 44

async function loadData() {
  loading.value = true
  try {
    const data: any = await getHomeData()
    banners.value = data.banners || []
    upcoming.value = data.upcoming || []
    recommended.value = data.recommendations || []
    hotList.value = data.hot_list || []
  } catch (e) {
    // error toast handled by request util
  } finally {
    loading.value = false
  }
}

function cdSeconds(item: any) {
  if (!item.sale_start_time) return 0
  const diff = Math.floor((new Date(item.sale_start_time).getTime() - Date.now()) / 1000)
  return diff > 0 ? diff : 0
}

function formatPrice(cents: number) {
  if (!cents || cents <= 0) return '价格待定'
  const yuan = cents / 100
  return '¥' + (Number.isInteger(yuan) ? yuan : yuan.toFixed(2)) + ' 起'
}

function goSearch() {
  uni.navigateTo({ url: '/pages/home/search' })
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
}

function onBanner(b: any) {
  if (b.link_type === 'PERFORMANCE' && b.link_id) {
    uni.navigateTo({ url: `/pages/detail/index?id=${b.link_id}` })
  }
}

onLoad(() => {
  loadData()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f5f5;
}
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.nav-content {
  height: 88rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 24rpx;
}
.logo {
  font-size: 40rpx;
  font-weight: 800;
  color: #FF6B35;
  margin-right: 24rpx;
}
.search-box {
  flex: 1;
  height: 64rpx;
  background: #f5f5f5;
  border-radius: 32rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 24rpx;
}
.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}
.search-placeholder {
  font-size: 26rpx;
  color: #999;
}
.banner-swiper {
  width: 100%;
  height: 320rpx;
}
.banner-img {
  width: 100%;
  height: 320rpx;
}
.section {
  margin-top: 24rpx;
  padding: 0 24rpx;
}
.section-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #222;
}
.h-scroll {
  width: 100%;
  white-space: nowrap;
}
.h-list {
  display: flex;
  flex-direction: row;
  padding-bottom: 8rpx;
}
.upcoming-card {
  display: inline-flex;
  flex-direction: column;
  width: 240rpx;
  margin-right: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.upcoming-poster {
  width: 240rpx;
  height: 320rpx;
  background: #f0f0f0;
}
.upcoming-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #222;
  padding: 12rpx 16rpx 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.upcoming-cd {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 16rpx 16rpx;
}
.cd-label {
  font-size: 22rpx;
  color: #999;
  margin-right: 8rpx;
}
.cd-now {
  font-size: 22rpx;
  color: #FF6B35;
  font-weight: 600;
}
.rec-card {
  display: inline-flex;
  flex-direction: column;
  width: 220rpx;
  margin-right: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.rec-poster {
  width: 220rpx;
  height: 294rpx;
  background: #f0f0f0;
}
.rec-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #222;
  padding: 12rpx 16rpx 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rec-price {
  font-size: 26rpx;
  font-weight: 700;
  color: #FF6B35;
  padding: 0 16rpx 16rpx;
}
.loading {
  text-align: center;
  padding: 40rpx;
  font-size: 26rpx;
  color: #999;
}
</style>
