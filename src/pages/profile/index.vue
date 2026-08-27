<template>
  <view class="profile">
    <!-- Not logged in -->
    <view v-if="!userStore.isLoggedIn" class="login-prompt">
      <image class="login-avatar" :src="placeholder" mode="aspectFill" />
      <text class="login-text">登录后享受更多服务</text>
      <view class="login-btn" @tap="goLogin">
        <text class="login-btn-text">登录 / 注册</text>
      </view>
    </view>

    <!-- Logged in -->
    <template v-else>
      <view class="user-header">
        <image class="avatar" :src="userStore.avatarUrl || placeholder" mode="aspectFill" />
        <view class="user-info">
          <text class="nickname">{{ userStore.nickname || '热场用户' }}</text>
          <text class="phone">{{ maskedPhone }}</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="goRealname">
          <text class="menu-icon">🪪</text>
          <text class="menu-label">实名认证</text>
          <text class="menu-value" :class="{ 'verified': realnameText === '已认证' }">{{ realnameText }}</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goAttendees">
          <text class="menu-icon">👥</text>
          <text class="menu-label">常用观演人</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="goOrders">
          <text class="menu-icon">📋</text>
          <text class="menu-label">我的订单</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goInvoice">
          <text class="menu-icon">📄</text>
          <text class="menu-label">发票管理</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="toastDev">
          <text class="menu-icon">👣</text>
          <text class="menu-label">观演足迹</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="toastDev">
          <text class="menu-icon">⚙️</text>
          <text class="menu-label">设置</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item logout" @tap="onLogout">
          <text class="logout-text">退出登录</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../../stores/user'

const placeholder = 'https://cdn.rechang.com/placeholder.jpg'
const userStore = useUserStore()

const maskedPhone = computed(() => {
  const p = userStore.phone
  if (!p) return '未绑定手机号'
  if (p.length >= 11) return p.slice(0, 3) + '****' + p.slice(-4)
  return p
})

const realnameText = computed(() => {
  const s = userStore.realnameStatus
  if (s === 'APPROVED') return '已认证'
  if (s === 'PENDING') return '审核中'
  return '未认证'
})

function goLogin() {
  uni.navigateTo({ url: '/pages/profile/login' })
}

function goRealname() {
  uni.navigateTo({ url: '/pages/profile/realname' })
}

function goAttendees() {
  uni.navigateTo({ url: '/pages/profile/attendees' })
}

function goInvoice() {
  uni.navigateTo({ url: '/pages/profile/invoice' })
}

function goOrders() {
  uni.navigateTo({ url: '/pages/order/list' })
}

function toastDev() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function onLogout() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages/home/index' })
      }
    }
  })
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f5f5f5;
}
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 160rpx 0;
  background: #fff;
}
.login-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  background: #f0f0f0;
  margin-bottom: 32rpx;
}
.login-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}
.login-btn {
  padding: 20rpx 80rpx;
  background: #FF6B35;
  border-radius: 44rpx;
}
.login-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 600;
}
.user-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 40rpx 32rpx;
  background: #fff;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #f0f0f0;
  margin-right: 28rpx;
}
.user-info {
  display: flex;
  flex-direction: column;
}
.nickname {
  font-size: 34rpx;
  font-weight: 700;
  color: #222;
}
.phone {
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
}
.menu-group {
  margin-top: 24rpx;
  background: #fff;
}
.menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}
.menu-label {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}
.menu-value {
  font-size: 26rpx;
  color: #999;
  margin-right: 12rpx;
}
.menu-value.verified {
  color: #FF6B35;
}
.menu-arrow {
  font-size: 36rpx;
  color: #ccc;
}
.menu-item.logout {
  justify-content: center;
}
.logout-text {
  font-size: 30rpx;
  color: #FF3B3B;
}
</style>
