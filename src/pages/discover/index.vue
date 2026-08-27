<template>
  <view class="discover">
    <!-- 顶部分段控件 -->
    <view class="segment">
      <view
        v-for="tab in tabs" :key="tab.key"
        class="seg-item" :class="{ active: activeTab === tab.key }"
        @tap="activeTab = tab.key"
      >{{ tab.label }}</view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view
        v-for="f in filters" :key="f.key"
        class="filter-item" :class="{ active: f.active }"
        @tap="toggleFilter(f.key)"
      >{{ f.label }} <text class="arrow">▾</text></view>
    </view>

    <!-- ====== 日历 Tab ====== -->
    <scroll-view v-if="activeTab === 'calendar'" scroll-y class="screen-content">
      <!-- 月份导航 -->
      <view class="cal-header">
        <text class="cal-title">{{ calYear }}年{{ calMonth + 1 }}月</text>
        <view class="cal-nav">
          <text class="cal-arrow" @tap="prevMonth">‹</text>
          <text class="cal-arrow" @tap="nextMonth">›</text>
        </view>
      </view>

      <!-- 星期表头 -->
      <view class="cal-week">
        <text v-for="w in weekDays" :key="w" class="cal-week-day">{{ w }}</text>
      </view>

      <!-- 日历网格 -->
      <view class="cal-grid">
        <view
          v-for="(day, idx) in calendarDays" :key="idx"
          class="cal-day" :class="{
            'out-month': !day.inMonth,
            'selected': day.date === selectedDate
          }"
          @tap="day.inMonth && selectDate(day.date)"
        >
          <text class="cal-day-num">{{ day.num }}</text>
          <view v-if="day.hasShow" class="cal-dot" :class="{ 'dot-selected': day.date === selectedDate }"></view>
        </view>
      </view>

      <!-- 选中日期的演出列表 -->
      <view class="cal-list-header">
        <text class="cal-list-title">{{ selectedDateLabel }} · {{ dayShows.length }}场演出</text>
      </view>

      <view v-if="dayShows.length > 0" class="cal-list">
        <view
          v-for="item in dayShows" :key="item.performance_id"
          class="perf-row" @tap="goDetail(item.performance_id || item.id)"
        >
          <image class="perf-poster" :src="item.poster_url" mode="aspectFill" />
          <view class="perf-info">
            <text class="perf-name">{{ item.name || item.perf_name }}</text>
            <text class="perf-sub">{{ formatTime(item.start_at) }} · {{ item.venue_name || '' }}</text>
            <view class="perf-tags">
              <text class="tag">{{ getTypeLabel(item.show_type || item.perf_type) }}</text>
            </view>
          </view>
          <text class="perf-price" :class="{ 'price-hot': item.is_hot_sale }">¥{{ Math.floor((item.min_price || 0) / 100) }}起</text>
        </view>
      </view>
      <empty-state v-else text="该日期暂无演出" />
    </scroll-view>

    <!-- ====== 地图 Tab ====== -->
    <scroll-view v-if="activeTab === 'map'" scroll-y class="screen-content">
      <!-- 地图占位区域 -->
      <view class="map-area">
        <view class="map-bg">
          <!-- 模拟道路 -->
          <view class="map-road road1"></view>
          <view class="map-road road2"></view>
          <view class="map-road road3"></view>
          <!-- 当前定位 -->
          <view class="map-loc">
            <view class="loc-dot"></view>
            <text class="loc-label">我的位置</text>
          </view>
          <!-- 场馆聚合点 -->
          <view class="map-pin pin1">
            <view class="pin-circle pin-lg">{{ nearbyList.length }}</view>
            <text class="pin-label">附近</text>
          </view>
        </view>
        <!-- 缩放控件 -->
        <view class="zoom-ctrl">
          <text class="zoom-btn" @tap="showToast('缩放功能开发中')">+</text>
          <view class="zoom-divider"></view>
          <text class="zoom-btn" @tap="showToast('缩放功能开发中')">−</text>
        </view>
        <view class="loc-ctrl" @tap="showToast('定位功能开发中')">🎯</view>
      </view>

      <!-- 附近演出列表 -->
      <view class="nearby-header">
        <text class="nearby-title">📍 附近演出</text>
        <text class="nearby-sort">按距离排序 ▾</text>
      </view>

      <view v-if="nearbyList.length > 0" class="nearby-list">
        <view
          v-for="item in nearbyList" :key="item.performance_id"
          class="perf-row" @tap="goDetail(item.performance_id)"
        >
          <image class="perf-poster-sm" :src="item.poster_url" mode="aspectFill" />
          <view class="perf-info">
            <text class="perf-name">{{ item.name }}</text>
            <text class="perf-sub">{{ item.venue_name }} · 距您 {{ (item.distance || 0).toFixed(1) }}km</text>
            <text class="perf-date">{{ formatDate(item.start_at) }}</text>
          </view>
          <text class="perf-price" :class="{ 'price-hot': item.is_hot_sale }">¥{{ Math.floor(item.min_price / 100) }}起</text>
        </view>
      </view>
      <empty-state v-else text="附近暂无演出" />
    </scroll-view>

    <!-- ====== 榜单 Tab ====== -->
    <scroll-view v-if="activeTab === 'ranking'" scroll-y class="screen-content">
      <!-- 榜单子Tab -->
      <view class="rank-sub-tabs">
        <text
          v-for="st in rankSubTabs" :key="st.key"
          class="rank-sub" :class="{ active: rankPeriod === st.key }"
          @tap="switchRankPeriod(st.key)"
        >{{ st.label }}</text>
      </view>
      <text class="rank-desc">📊 基于预约量·浏览量·购票量加权计算 · 每5分钟更新</text>

      <!-- TOP 3 领奖台 -->
      <view v-if="rankingList.length >= 3" class="podium">
        <!-- 第2名 -->
        <view class="podium-item" @tap="goDetail(rankingList[1].performance_id)">
          <view class="podium-medal">🥈</view>
          <image class="podium-avatar sm" :src="rankingList[1].poster_url" mode="aspectFill" />
          <text class="podium-name">{{ truncate(rankingList[1].name, 8) }}</text>
          <text class="podium-score">热度 {{ rankingList[1].hot_score }}</text>
        </view>
        <!-- 第1名 -->
        <view class="podium-item" @tap="goDetail(rankingList[0].performance_id)">
          <view class="podium-medal lg">🥇</view>
          <image class="podium-avatar lg" :src="rankingList[0].poster_url" mode="aspectFill" />
          <text class="podium-name bold">{{ truncate(rankingList[0].name, 8) }}</text>
          <text class="podium-score">热度 {{ rankingList[0].hot_score }}</text>
        </view>
        <!-- 第3名 -->
        <view class="podium-item" @tap="goDetail(rankingList[2].performance_id)">
          <view class="podium-medal">🥉</view>
          <image class="podium-avatar sm" :src="rankingList[2].poster_url" mode="aspectFill" />
          <text class="podium-name">{{ truncate(rankingList[2].name, 8) }}</text>
          <text class="podium-score">热度 {{ rankingList[2].hot_score }}</text>
        </view>
      </view>

      <!-- 分隔线 -->
      <view v-if="rankingList.length >= 3" class="divider"></view>

      <!-- 排行列表 4+ -->
      <view class="rank-list">
        <view
          v-for="item in rankingList.slice(3)" :key="item.performance_id"
          class="perf-row" @tap="goDetail(item.performance_id)"
        >
          <text class="rank-num">{{ item.rank }}</text>
          <image class="perf-poster-sm" :src="item.poster_url" mode="aspectFill" />
          <view class="perf-info">
            <text class="perf-name">{{ item.name }}</text>
            <text class="perf-sub">{{ formatDate(item.start_at) }} · {{ item.venue_name }}</text>
            <view class="score-bar-wrap">
              <view class="score-bar-bg">
                <view class="score-bar" :style="{ width: scorePercent(item.hot_score) + '%', background: scoreColor(item.hot_score) }"></view>
              </view>
              <text class="score-text">{{ item.hot_score }}</text>
            </view>
          </view>
          <text class="perf-price">¥{{ Math.floor(item.min_price / 100) }}起</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getShowList, getRanking, getNearby } from '../../api/show'
import EmptyState from '../../components/empty-state.vue'

const tabs = [
  { key: 'calendar', label: '日历' },
  { key: 'map', label: '地图' },
  { key: 'ranking', label: '榜单' }
]
const activeTab = ref('calendar')

const filters = ref([
  { key: 'type', label: '类型', active: false },
  { key: 'time', label: '时间', active: false },
  { key: 'price', label: '价格', active: false },
  { key: 'city', label: '城市', active: false }
])

function toggleFilter(key: string) {
  const f = filters.value.find(x => x.key === key)
  if (f) f.active = !f.active
  if (f && f.active) {
    uni.showToast({ title: `${f.label}筛选开发中`, icon: 'none' })
    f.active = false
  }
}

// ===== 日历 =====
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())
const selectedDate = ref(formatDateStr(new Date()))
const allShows = ref<any[]>([])

const calendarDays = computed(() => {
  const firstDay = new Date(calYear.value, calMonth.value, 1)
  const lastDay = new Date(calYear.value, calMonth.value + 1, 0)
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const days: any[] = []

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(calYear.value, calMonth.value, -startOffset + i + 1)
    days.push({ num: d.getDate(), date: '', inMonth: false, hasShow: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${calYear.value}-${String(calMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const hasShow = allShows.value.some(s => {
      const sd = s.start_at || ''
      return sd.startsWith(dateStr)
    })
    days.push({ num: i, date: dateStr, inMonth: true, hasShow })
  }
  return days
})

const dayShows = computed(() => {
  return allShows.value.filter(s => {
    const sd = s.start_at || ''
    return sd.startsWith(selectedDate.value)
  })
})

const selectedDateLabel = computed(() => {
  const d = selectedDate.value.split('-')
  return `${parseInt(d[1])}月${parseInt(d[2])}日`
})

function prevMonth() {
  calMonth.value--
  if (calMonth.value < 0) { calMonth.value = 11; calYear.value-- }
}
function nextMonth() {
  calMonth.value++
  if (calMonth.value > 11) { calMonth.value = 0; calYear.value++ }
}
function selectDate(date: string) {
  selectedDate.value = date
}

// ===== 地图 =====
const nearbyList = ref<any[]>([])

// ===== 榜单 =====
const rankSubTabs = [
  { key: 'realtime', label: '🔥 实时榜' },
  { key: 'week', label: '周榜' },
  { key: 'month', label: '月榜' }
]
const rankPeriod = ref('realtime')
const rankingList = ref<any[]>([])

function switchRankPeriod(key: string) {
  rankPeriod.value = key
  loadRanking()
}

// ===== 工具函数 =====
function formatDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatDate(d: string) {
  if (!d) return ''
  return d.replace(/-/g, '.').substring(5, 10)
}
function formatTime(d: string) {
  if (!d) return ''
  return d.substring(11, 16)
}
function getTypeLabel(t: string) {
  const map: Record<string, string> = { CONCERT: '演唱会', DRAMA: '话剧', SPORT: '体育', EXHIBITION: '展览' }
  return map[t] || '演出'
}
function truncate(s: string, n: number) {
  return s && s.length > n ? s.substring(0, n) + '...' : s
}
function scorePercent(score: number) {
  const max = rankingList.value[0]?.hot_score || 1
  return Math.max(10, Math.floor((score / max) * 100))
}
function scoreColor(score: number) {
  if (score > 700) return '#ef4444'
  if (score > 400) return '#f59e0b'
  return '#3b82f6'
}
function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}` })
}
function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

// ===== 数据加载 =====
async function loadShows() {
  try {
    const data = await getShowList({ page: 1, size: 100 })
    allShows.value = data.list || []
  } catch (e) { /* handled by request util */ }
}

async function loadNearby() {
  try {
    const data = await getNearby(39.9, 116.4, 50, 1, 20)
    nearbyList.value = data.list || []
  } catch (e) { /* handled */ }
}

async function loadRanking() {
  try {
    const data = await getRanking(rankPeriod.value, '', 10)
    rankingList.value = data || []
  } catch (e) { /* handled */ }
}

onMounted(() => {
  loadShows()
  loadNearby()
  loadRanking()
})

onShow(() => {
  if (allShows.value.length === 0) loadShows()
  if (nearbyList.value.length === 0) loadNearby()
  if (rankingList.value.length === 0) loadRanking()
})
</script>

<style scoped>
.discover {
  min-height: 100vh;
  background: #fff;
}

/* 分段控件 */
.segment {
  display: flex;
  border-bottom: 1rpx solid #eef0f3;
}
.seg-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #999;
  position: relative;
}
.seg-item.active {
  color: #333;
  font-weight: 600;
}
.seg-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 6rpx;
  background: #333;
  border-radius: 4rpx;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 24rpx;
}
.filter-item {
  background: #f5f5f5;
  border: none;
  border-radius: 32rpx;
  padding: 8rpx 24rpx;
  font-size: 24rpx;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4rpx;
}
.filter-item.active {
  background: #333;
  color: #fff;
}
.filter-item .arrow {
  font-size: 20rpx;
}

/* 屏幕内容 */
.screen-content {
  height: calc(100vh - 180rpx);
}

/* ===== 日历 ===== */
.cal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx 12rpx;
}
.cal-title {
  font-size: 32rpx;
  font-weight: 600;
}
.cal-nav {
  display: flex;
  gap: 20rpx;
}
.cal-arrow {
  font-size: 36rpx;
  color: #999;
  padding: 0 8rpx;
}
.cal-week {
  display: flex;
}
.cal-week-day {
  flex: 1;
  text-align: center;
  font-size: 22rpx;
  color: #999;
  padding: 8rpx 0;
}
.cal-grid {
  display: flex;
  flex-wrap: wrap;
}
.cal-day {
  width: calc(100% / 7);
  text-align: center;
  padding: 12rpx 0;
  position: relative;
}
.cal-day-num {
  font-size: 24rpx;
}
.cal-day.out-month .cal-day-num {
  color: #ccc;
}
.cal-day.selected .cal-day-num {
  display: inline-block;
  width: 48rpx;
  height: 48rpx;
  line-height: 48rpx;
  background: #333;
  color: #fff;
  border-radius: 50%;
}
.cal-dot {
  width: 8rpx;
  height: 8rpx;
  background: #999;
  border-radius: 50%;
  margin: 4rpx auto 0;
}
.cal-dot.dot-selected {
  background: #fff;
}
.cal-list-header {
  padding: 20rpx 24rpx 8rpx;
  border-top: 1rpx solid #eef0f3;
  margin-top: 8rpx;
}
.cal-list-title {
  font-size: 28rpx;
  font-weight: 600;
}
.cal-list {
  padding: 0 24rpx;
}

/* ===== 演出行 ===== */
.perf-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  gap: 16rpx;
}
.perf-poster {
  width: 112rpx;
  height: 144rpx;
  border-radius: 12rpx;
  background: #e2e5e9;
  flex-shrink: 0;
}
.perf-poster-sm {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  background: #e2e5e9;
  flex-shrink: 0;
}
.perf-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  overflow: hidden;
}
.perf-name {
  font-size: 26rpx;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.perf-sub {
  font-size: 22rpx;
  color: #999;
}
.perf-date {
  font-size: 22rpx;
  color: #999;
}
.perf-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 4rpx;
}
.tag {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 16rpx;
  background: #e2e5e9;
  color: #666;
}
.perf-price {
  font-size: 24rpx;
  color: #666;
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  background: #e2e5e9;
  flex-shrink: 0;
}
.perf-price.price-hot {
  background: #333;
  color: #fff;
}

/* ===== 地图 ===== */
.map-area {
  height: 680rpx;
  position: relative;
  overflow: hidden;
  background: #e8ecf0;
}
.map-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background:
    radial-gradient(circle at 30% 40%, #d5d9de 0%, transparent 40%),
    radial-gradient(circle at 70% 60%, #d5d9de 0%, transparent 35%),
    linear-gradient(135deg, #eef0f3 0%, #e2e5e9 100%);
}
.map-road {
  position: absolute;
  background: #cdd1d7;
}
.road1 { top: 20%; left: 10%; width: 80%; height: 1rpx; transform: rotate(15deg); }
.road2 { top: 50%; left: 5%; width: 90%; height: 1rpx; transform: rotate(-8deg); }
.road3 { top: 10%; left: 40%; width: 1rpx; height: 80%; transform: rotate(10deg); }
.map-loc {
  position: absolute;
  top: 45%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.loc-dot {
  width: 32rpx;
  height: 32rpx;
  background: #3b82f6;
  border: 6rpx solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 12rpx rgba(59, 130, 246, 0.2);
  margin: 0 auto;
}
.loc-label {
  font-size: 20rpx;
  color: #3b82f6;
  margin-top: 4rpx;
  font-weight: 600;
  display: block;
}
.map-pin {
  position: absolute;
  text-align: center;
}
.pin1 { top: 25%; left: 25%; }
.pin-circle {
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  margin: 0 auto;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.2);
}
.pin-lg { width: 72rpx; height: 72rpx; background: #333; font-size: 24rpx; }
.pin-label {
  font-size: 20rpx;
  color: #333;
  margin-top: 4rpx;
  font-weight: 500;
  display: block;
}
.zoom-ctrl {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
  overflow: hidden;
}
.zoom-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}
.zoom-divider {
  height: 1rpx;
  background: #eef0f3;
}
.loc-ctrl {
  position: absolute;
  right: 24rpx;
  top: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}
.nearby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx 12rpx;
}
.nearby-title {
  font-size: 28rpx;
  font-weight: 600;
}
.nearby-sort {
  font-size: 22rpx;
  color: #999;
}
.nearby-list {
  padding: 0 24rpx;
}

/* ===== 榜单 ===== */
.rank-sub-tabs {
  display: flex;
  padding: 16rpx 24rpx;
  gap: 16rpx;
}
.rank-sub {
  font-size: 24rpx;
  padding: 6rpx 24rpx;
  border-radius: 24rpx;
  background: #e2e5e9;
  color: #666;
  border: 1rpx solid #cdd1d7;
}
.rank-sub.active {
  background: #333;
  color: #fff;
  border-color: #333;
}
.rank-desc {
  font-size: 22rpx;
  color: #999;
  padding: 0 24rpx 16rpx;
  display: block;
}

/* TOP 3 领奖台 */
.podium {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  align-items: flex-end;
  justify-content: center;
}
.podium-item {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.podium-medal {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}
.podium-medal.lg {
  font-size: 48rpx;
}
.podium-avatar {
  border-radius: 50%;
  background: #d5d9de;
}
.podium-avatar.sm {
  width: 96rpx;
  height: 96rpx;
}
.podium-avatar.lg {
  width: 120rpx;
  height: 120rpx;
}
.podium-name {
  font-size: 22rpx;
  margin-top: 8rpx;
  font-weight: 500;
}
.podium-name.bold {
  font-size: 24rpx;
  font-weight: 600;
}
.podium-score {
  font-size: 20rpx;
  color: #999;
  margin-top: 2rpx;
}

.divider {
  height: 1rpx;
  background: #eef0f3;
  margin: 0 24rpx;
}

/* 排行列表 */
.rank-list {
  padding: 0 24rpx;
}
.rank-num {
  width: 48rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #999;
  flex-shrink: 0;
}
.score-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 4rpx;
}
.score-bar-bg {
  width: 120rpx;
  height: 8rpx;
  background: #e2e5e9;
  border-radius: 4rpx;
}
.score-bar {
  height: 100%;
  border-radius: 4rpx;
}
.score-text {
  font-size: 20rpx;
  color: #999;
}
</style>
