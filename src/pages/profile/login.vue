<template>
  <view class="login-page">
    <view class="logo-section">
      <view class="logo-circle">
        <text class="logo-text">热场</text>
      </view>
      <text class="app-name">热场 Rechang</text>
      <text class="app-slogan">发现身边的精彩演出</text>
    </view>

    <view class="login-section">
      <button
        class="wx-login-btn"
        :loading="loading"
        :disabled="loading"
        @tap="onWeChatLogin"
      >
        <text class="wx-login-text">微信一键登录</text>
      </button>
      <text class="login-tip">登录即代表同意以下协议</text>
    </view>

    <view class="footer">
      <text class="privacy-link" @tap="openPrivacy">《用户隐私协议》</text>
      <text class="footer-sep">|</text>
      <text class="privacy-link" @tap="openService">《用户服务协议》</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const loading = ref(false)

onLoad(() => {
  if (userStore.isLoggedIn && !userStore.needPhone && !userStore.needRealname) {
    uni.switchTab({ url: '/pages/profile/index' })
  }
})

async function onWeChatLogin() {
  if (loading.value) return
  loading.value = true
  let code = ''
  try {
    const res: any = await uni.login({ provider: 'weixin' })
    const data = Array.isArray(res) ? res[1] : res
    code = data?.code || ''
  } catch (e) {
    code = ''
  }
  if (!code) {
    code = 'mock_code_001'
  }
  try {
    await userStore.login(code, '热场用户', '')
    if (userStore.needPhone) {
      uni.redirectTo({ url: '/pages/profile/phone-bind' })
    } else if (userStore.needRealname) {
      uni.redirectTo({ url: '/pages/profile/realname' })
    } else {
      uni.switchTab({ url: '/pages/profile/index' })
    }
  } catch (e) {
    // error handled by request util
  } finally {
    loading.value = false
  }
}

function openPrivacy() {
  uni.showToast({ title: '隐私协议开发中', icon: 'none' })
}

function openService() {
  uni.showToast({ title: '服务协议开发中', icon: 'none' })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 0 64rpx;
  padding-bottom: env(safe-area-inset-bottom);
}
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}
.logo-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  background: linear-gradient(135deg, #FF6B35, #FF3B3B);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(255, 107, 53, 0.3);
}
.logo-text {
  font-size: 52rpx;
  font-weight: 700;
  color: #fff;
}
.app-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #222;
  margin-bottom: 12rpx;
}
.app-slogan {
  font-size: 26rpx;
  color: #999;
}
.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex: 1;
  justify-content: center;
}
.wx-login-btn {
  width: 100%;
  height: 96rpx;
  background: #FF6B35;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 96rpx;
  padding: 0;
  margin: 0;
}
.wx-login-btn::after {
  border: none;
}
.wx-login-btn[disabled] {
  background: #ffb39a;
}
.wx-login-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}
.login-tip {
  font-size: 24rpx;
  color: #bbb;
  margin-top: 32rpx;
}
.footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-bottom: 60rpx;
}
.privacy-link {
  font-size: 24rpx;
  color: #FF6B35;
}
.footer-sep {
  font-size: 24rpx;
  color: #ddd;
  margin: 0 12rpx;
}
</style>
