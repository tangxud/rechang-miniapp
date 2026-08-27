<template>
  <view class="attendees">
    <view class="page-header">
      <text class="header-count">共 {{ list.length }} 位观演人</text>
      <view class="add-btn" @tap="goAdd">
        <text class="add-btn-text">+ 新增</text>
      </view>
    </view>

    <view v-if="loading && list.length === 0" class="loading">
      <text>加载中...</text>
    </view>

    <EmptyState
      v-else-if="list.length === 0"
      text="暂无常用观演人"
      icon="👥"
    />

    <view v-else class="list">
      <view v-for="item in list" :key="item.id" class="attendee-card">
        <view class="attendee-info" @tap="goEdit(item)">
          <text class="attendee-name">{{ item.name }}</text>
          <text class="attendee-idcard">{{ maskIdCard(item.id_card_masked || '') }}</text>
        </view>
        <view class="attendee-actions">
          <view class="action-btn" @tap="goEdit(item)">
            <text class="action-text">编辑</text>
          </view>
          <view class="action-btn delete" @tap="onDelete(item)">
            <text class="action-text delete-text">删除</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAttendeeList, deleteAttendee } from '../../api/attendee'
import EmptyState from '../../components/empty-state.vue'

const list = ref<any[]>([])
const loading = ref(false)

onShow(() => {
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const data: any = await getAttendeeList()
    list.value = Array.isArray(data) ? data : (data?.list || [])
  } catch (e) {
    // error handled by request util
  } finally {
    loading.value = false
  }
}

function maskIdCard(idCard: string): string {
  if (!idCard) return ''
  if (idCard.length < 8) return idCard
  return idCard.slice(0, 4) + '*'.repeat(idCard.length - 8) + idCard.slice(-4)
}

function goAdd() {
  uni.navigateTo({ url: '/pages/profile/attendee-edit' })
}

function goEdit(item: any) {
  const idCard = item.id_card_masked || ''
  uni.navigateTo({
    url: `/pages/profile/attendee-edit?id=${item.id}&name=${encodeURIComponent(item.name)}&idcard=${encodeURIComponent(idCard)}`
  })
}

function onDelete(item: any) {
  uni.showModal({
    title: '提示',
    content: `确定删除观演人「${item.name}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteAttendee(item.id)
          uni.showToast({ title: '已删除', icon: 'success' })
          loadList()
        } catch (e) {
          // error handled by request util
        }
      }
    }
  })
}
</script>

<style scoped>
.attendees {
  min-height: 100vh;
  background: #f5f5f5;
}
.page-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
}
.header-count {
  font-size: 26rpx;
  color: #999;
}
.add-btn {
  padding: 12rpx 32rpx;
  background: #FF6B35;
  border-radius: 32rpx;
}
.add-btn-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
}
.loading {
  text-align: center;
  padding: 120rpx 0;
  font-size: 28rpx;
  color: #999;
}
.list {
  padding: 0 32rpx;
}
.attendee-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.attendee-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.attendee-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
  margin-bottom: 8rpx;
}
.attendee-idcard {
  font-size: 26rpx;
  color: #999;
}
.attendee-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  margin-left: 16rpx;
}
.action-text {
  font-size: 26rpx;
  color: #FF6B35;
}
.action-btn.delete {
  background: #fff0f0;
}
.delete-text {
  color: #FF3B3B;
}
</style>
