<template>
  <view class="realname">
    <!-- Verified state -->
    <view v-if="isVerified" class="verified-card">
      <view class="verified-icon-wrap">
        <text class="verified-icon">✓</text>
      </view>
      <text class="verified-title">实名认证已通过</text>
      <view class="verified-info">
        <view class="info-row">
          <text class="info-label">姓名</text>
          <text class="info-value">{{ maskedName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">身份证</text>
          <text class="info-value">{{ maskedIdCard }}</text>
        </view>
      </view>
      <text class="verified-tip">如需修改认证信息，请联系客服</text>
    </view>

    <!-- Upload form -->
    <template v-else>
      <view class="desc-card">
        <text class="desc-text">根据国家相关规定，购票需实名认证</text>
        <text v-if="isRejected" class="reject-tip">上次认证未通过，请重新提交</text>
      </view>

      <view class="upload-card">
        <text class="upload-title">身份证信息</text>

        <view class="upload-item">
          <text class="upload-label">人像面</text>
          <view class="upload-area" @tap="chooseImage('front')">
            <image
              v-if="frontPreview"
              class="upload-preview"
              :src="frontPreview"
              mode="aspectFill"
            />
            <view v-else class="upload-placeholder">
              <text class="upload-icon">🪪</text>
              <text class="upload-hint">点击上传人像面</text>
            </view>
          </view>
        </view>

        <view class="upload-item">
          <text class="upload-label">国徽面</text>
          <view class="upload-area" @tap="chooseImage('back')">
            <image
              v-if="backPreview"
              class="upload-preview"
              :src="backPreview"
              mode="aspectFill"
            />
            <view v-else class="upload-placeholder">
              <text class="upload-icon">🪪</text>
              <text class="upload-hint">点击上传国徽面</text>
            </view>
          </view>
        </view>

        <view class="upload-item">
          <text class="upload-label">人脸照片</text>
          <text class="upload-optional">（选填）</text>
          <view class="upload-area" @tap="chooseImage('face')">
            <image
              v-if="facePreview"
              class="upload-preview"
              :src="facePreview"
              mode="aspectFill"
            />
            <view v-else class="upload-placeholder">
              <text class="upload-icon">🤳</text>
              <text class="upload-hint">点击上传人脸照片</text>
            </view>
          </view>
        </view>
      </view>

      <view class="submit-section">
        <button
          class="submit-btn"
          :loading="submitting"
          :disabled="submitting"
          @tap="onSubmit"
        >
          <text class="submit-btn-text">提交认证</text>
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { submitRealname, getRealnameStatus } from '../../api/auth'

const userStore = useUserStore()

const frontPreview = ref('')
const backPreview = ref('')
const facePreview = ref('')
const frontUrl = ref('')
const backUrl = ref('')
const faceUrl = ref('')
const submitting = ref(false)
const verifiedName = ref('')
const verifiedIdCard = ref('')
const serverStatus = ref('')

const isVerified = computed(() => {
  const s = serverStatus.value || userStore.realnameStatus
  return s === 'APPROVED'
})

const isRejected = computed(() => {
  const s = serverStatus.value || userStore.realnameStatus
  return s === 'REJECTED'
})

const maskedName = computed(() => {
  const n = verifiedName.value
  if (!n) return ''
  if (n.length <= 1) return n
  if (n.length === 2) return n[0] + '*'
  return n[0] + '*'.repeat(n.length - 2) + n[n.length - 1]
})

const maskedIdCard = computed(() => {
  const id = verifiedIdCard.value
  if (!id || id.length < 8) return id
  return id.slice(0, 4) + '*'.repeat(id.length - 8) + id.slice(-4)
})

onLoad(() => {
  loadStatus()
})

async function loadStatus() {
  try {
    const data: any = await getRealnameStatus()
    const status = data.status || data.realname_status || ''
    serverStatus.value = status
    if (status === 'APPROVED') {
      verifiedName.value = data.name || ''
      verifiedIdCard.value = data.id_card_no || data.idCardNo || ''
    }
  } catch (e) {
    serverStatus.value = userStore.realnameStatus
  }
}

function chooseImage(type: 'front' | 'back' | 'face') {
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempPath = res.tempFilePaths[0]
      if (type === 'front') {
        frontPreview.value = tempPath
        frontUrl.value = 'https://cdn.rechang.com/mock/idcard_front.jpg'
      } else if (type === 'back') {
        backPreview.value = tempPath
        backUrl.value = 'https://cdn.rechang.com/mock/idcard_back.jpg'
      } else {
        facePreview.value = tempPath
        faceUrl.value = 'https://cdn.rechang.com/mock/face.jpg'
      }
    }
  })
}

async function onSubmit() {
  if (!frontUrl.value || !backUrl.value) {
    uni.showToast({ title: '请上传身份证正反面', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    await submitRealname(frontUrl.value, backUrl.value, faceUrl.value)
    uni.showToast({ title: '提交成功，等待审核', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    // error handled by request util
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.realname {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}
.verified-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 32rpx;
  padding: 56rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.verified-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #e8f7ee;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}
.verified-icon {
  font-size: 64rpx;
  color: #07c160;
  font-weight: 700;
}
.verified-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #222;
  margin-bottom: 40rpx;
}
.verified-info {
  width: 100%;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 8rpx 28rpx;
}
.info-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  font-size: 28rpx;
  color: #999;
  width: 120rpx;
  flex-shrink: 0;
}
.info-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}
.verified-tip {
  font-size: 24rpx;
  color: #bbb;
  margin-top: 40rpx;
}
.desc-card {
  margin: 32rpx;
  padding: 28rpx;
  background: #fff4e6;
  border-radius: 16rpx;
}
.desc-text {
  font-size: 28rpx;
  color: #FF6B35;
}
.reject-tip {
  display: block;
  font-size: 24rpx;
  color: #FF3B3B;
  margin-top: 12rpx;
}
.upload-card {
  margin: 0 32rpx 32rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.upload-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
  margin-bottom: 32rpx;
}
.upload-item {
  margin-bottom: 36rpx;
}
.upload-item:last-child {
  margin-bottom: 0;
}
.upload-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}
.upload-optional {
  font-size: 24rpx;
  color: #bbb;
}
.upload-area {
  margin-top: 16rpx;
  width: 100%;
  height: 320rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  border: 2rpx dashed #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.upload-preview {
  width: 100%;
  height: 100%;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.upload-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}
.upload-hint {
  font-size: 26rpx;
  color: #999;
}
.submit-section {
  padding: 0 32rpx 60rpx;
}
.submit-btn {
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
.submit-btn::after {
  border: none;
}
.submit-btn[disabled] {
  background: #ffb39a;
}
.submit-btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}
</style>
