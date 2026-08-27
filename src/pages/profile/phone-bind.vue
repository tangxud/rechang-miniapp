<template>
  <view class="phone-bind">
    <view class="header">
      <text class="header-title">绑定手机号</text>
      <text class="header-desc">绑定手机号后可接收订单通知与开票提醒</text>
    </view>

    <view class="card">
      <button
        class="wx-phone-btn"
        open-type="getPhoneNumber"
        :loading="binding"
        :disabled="binding"
        @getphonenumber="onGetPhone"
      >
        <text class="wx-phone-text">微信一键获取手机号</text>
      </button>

      <view class="divider">
        <view class="divider-line"></view>
        <text class="divider-text">或手动输入</text>
        <view class="divider-line"></view>
      </view>

      <view class="input-group">
        <input
          class="phone-input"
          v-model="phone"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="placeholder"
        />
      </view>

      <button
        class="bind-btn"
        :loading="binding"
        :disabled="binding"
        @tap="onManualBind"
      >
        <text class="bind-btn-text">绑定</text>
      </button>
    </view>

    <view class="skip-btn" @tap="onSkip">
      <text class="skip-text">暂不绑定</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../../stores/user'
import { bindPhone } from '../../api/auth'

const userStore = useUserStore()
const phone = ref('')
const binding = ref(false)

function onGetPhone(e: any) {
  const detail = e.detail || {}
  if (detail.errMsg && !detail.errMsg.includes('ok')) {
    uni.showToast({ title: '取消获取手机号', icon: 'none' })
    return
  }
  const wxPhone = detail.phoneNumber || detail.code || ''
  if (wxPhone) {
    doBind(wxPhone)
  } else {
    uni.showToast({ title: '请手动输入手机号', icon: 'none' })
  }
}

function onManualBind() {
  const p = phone.value.trim()
  if (!p) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!/^1[3-9]\d{9}$/.test(p)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }
  doBind(p)
}

async function doBind(p: string) {
  if (binding.value) return
  binding.value = true
  try {
    await bindPhone(p)
    await userStore.fetchProfile()
    uni.showToast({ title: '绑定成功', icon: 'success' })
    setTimeout(() => {
      if (userStore.needRealname) {
        uni.redirectTo({ url: '/pages/profile/realname' })
      } else {
        uni.switchTab({ url: '/pages/profile/index' })
      }
    }, 1000)
  } catch (e) {
    // error handled by request util
  } finally {
    binding.value = false
  }
}

function onSkip() {
  uni.switchTab({ url: '/pages/profile/index' })
}
</script>

<style scoped>
.phone-bind {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0 32rpx;
}
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0 48rpx;
}
.header-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #222;
  margin-bottom: 16rpx;
}
.header-desc {
  font-size: 26rpx;
  color: #999;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.wx-phone-btn {
  width: 100%;
  height: 96rpx;
  background: #07c160;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 96rpx;
  padding: 0;
  margin: 0;
}
.wx-phone-btn::after {
  border: none;
}
.wx-phone-btn[disabled] {
  background: #9ad8b8;
}
.wx-phone-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}
.divider {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 40rpx 0;
}
.divider-line {
  flex: 1;
  height: 1rpx;
  background: #eee;
}
.divider-text {
  font-size: 24rpx;
  color: #bbb;
  margin: 0 24rpx;
}
.input-group {
  margin-bottom: 32rpx;
}
.phone-input {
  width: 100%;
  height: 96rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 28rpx;
  font-size: 32rpx;
  color: #333;
  box-sizing: border-box;
}
.placeholder {
  color: #bbb;
  font-size: 30rpx;
}
.bind-btn {
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
.bind-btn::after {
  border: none;
}
.bind-btn[disabled] {
  background: #ffb39a;
}
.bind-btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}
.skip-btn {
  display: flex;
  justify-content: center;
  padding: 48rpx 0;
}
.skip-text {
  font-size: 28rpx;
  color: #999;
}
</style>
