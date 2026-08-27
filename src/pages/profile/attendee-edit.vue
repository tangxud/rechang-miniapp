<template>
  <view class="attendee-edit">
    <view class="form-card">
      <view class="form-item">
        <text class="form-label">姓名</text>
        <input
          class="form-input"
          v-model="name"
          type="text"
          placeholder="请输入观演人姓名"
          placeholder-class="placeholder"
          maxlength="20"
        />
      </view>

      <view class="form-item">
        <text class="form-label">身份证号</text>
        <view class="idcard-input-wrap">
          <text v-if="editId && currentMasked" class="idcard-current">{{ currentMasked }}</text>
          <input
            class="form-input"
            v-model="idCardNo"
            type="text"
            :placeholder="editId ? '如需修改请输入新身份证号' : '请输入18位身份证号'"
            placeholder-class="placeholder"
            maxlength="18"
          />
        </view>
      </view>
    </view>

    <view class="tips">
      <text class="tips-text">· 每位观演人最多可绑定 1 张身份证</text>
      <text class="tips-text">· 身份证信息仅用于购票实名，不会用于其他用途</text>
    </view>

    <view class="submit-section">
      <button
        class="submit-btn"
        :loading="saving"
        :disabled="saving"
        @tap="onSave"
      >
        <text class="submit-btn-text">保存</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createAttendee, updateAttendee } from '../../api/attendee'

const editId = ref<number | null>(null)
const name = ref('')
const idCardNo = ref('')
const currentMasked = ref('')
const saving = ref(false)

onLoad((options: any) => {
  if (options?.id) {
    editId.value = Number(options.id)
    name.value = decodeURIComponent(options.name || '')
    currentMasked.value = decodeURIComponent(options.idcard || '')
    uni.setNavigationBarTitle({ title: '编辑观演人' })
  } else {
    uni.setNavigationBarTitle({ title: '新增观演人' })
  }
})

const ID_CARD_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const ID_CARD_CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

function isValidIdCard(id: string): boolean {
  if (!/^\d{17}[\dXx]$/.test(id)) return false
  const birthStr = id.substring(6, 14)
  const y = parseInt(birthStr.substring(0, 4))
  const m = parseInt(birthStr.substring(4, 6))
  const d = parseInt(birthStr.substring(6, 8))
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false
  if (date > new Date()) return false
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id.charAt(i)) * ID_CARD_WEIGHTS[i]
  }
  const expected = ID_CARD_CHECK_CODES[sum % 11]
  return expected === id.charAt(17).toUpperCase()
}

function validate(): string | null {
  const n = name.value.trim()
  const id = idCardNo.value.trim()
  if (!n) return '请输入姓名'
  if (!editId.value) {
    if (!id) return '请输入身份证号'
    if (!isValidIdCard(id)) return '身份证号无效（格式或校验码错误）'
  } else if (id) {
    if (!isValidIdCard(id)) return '身份证号无效（格式或校验码错误）'
  }
  return null
}

async function onSave() {
  const error = validate()
  if (error) {
    uni.showToast({ title: error, icon: 'none' })
    return
  }
  if (saving.value) return
  saving.value = true
  try {
    const n = name.value.trim()
    const id = idCardNo.value.trim().toUpperCase()
    if (editId.value != null) {
      await updateAttendee(editId.value, n, id)
    } else {
      await createAttendee(n, id)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (e) {
    // error handled by request util
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.attendee-edit {
  min-height: 100vh;
  background: #f5f5f5;
}
.form-card {
  margin: 32rpx;
  padding: 8rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.form-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.form-item:last-child {
  border-bottom: none;
}
.form-label {
  font-size: 30rpx;
  color: #333;
  width: 160rpx;
  flex-shrink: 0;
}
.form-input {
  flex: 1;
  font-size: 30rpx;
  color: #222;
}
.placeholder {
  color: #bbb;
}
.idcard-input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.idcard-current {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}
.tips {
  padding: 0 32rpx;
}
.tips-text {
  display: block;
  font-size: 24rpx;
  color: #bbb;
  line-height: 1.8;
}
.submit-section {
  padding: 48rpx 32rpx;
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
