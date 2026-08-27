<template>
  <view class="invoice-page">
    <view class="segment">
      <view
        v-for="tab in tabs" :key="tab.key"
        class="seg-item" :class="{ active: activeTab === tab.key }"
        @tap="activeTab = tab.key"
      >{{ tab.label }}</view>
    </view>

    <!-- 申请开票 Tab -->
    <scroll-view v-if="activeTab === 'apply'" scroll-y class="content">
      <view v-if="invoiceableOrders.length === 0" class="empty-wrap">
        <EmptyState text="暂无可开票的订单" icon="📄" />
      </view>
      <view v-else>
        <view
          v-for="order in invoiceableOrders" :key="order.id"
          class="card"
        >
          <view class="order-info">
            <image class="poster" :src="order.poster_url || placeholder" mode="aspectFill" />
            <view class="order-detail">
              <text class="perf-name">{{ order.performance_name }}</text>
              <text class="order-no">订单号 {{ order.order_no }}</text>
              <text class="order-amount">¥{{ formatPrice(order.total_amount) }}</text>
            </view>
            <text class="status-tag st-green">可开票</text>
          </view>

          <view v-if="order.invoice" class="invoice-done">
            <text class="done-text">已开具发票 {{ order.invoice.invoice_no }}</text>
            <text class="download-link" @tap="downloadInvoice(order.invoice.id)">下载</text>
          </view>
          <view v-else class="invoice-form">
            <view class="form-group">
              <text class="form-label">抬头类型</text>
              <view class="type-tags">
                <text
                  class="type-tag" :class="{ active: order._titleType === 'PERSONAL' }"
                  @tap="order._titleType = 'PERSONAL'"
                >个人</text>
                <text
                  class="type-tag" :class="{ active: order._titleType === 'ENTERPRISE' }"
                  @tap="order._titleType = 'ENTERPRISE'"
                >企业</text>
              </view>
            </view>
            <view class="form-group">
              <text class="form-label">抬头名称</text>
              <input
                class="form-input"
                v-model="order._invoiceTitle"
                :placeholder="order._titleType === 'PERSONAL' ? '请输入个人姓名' : '请输入企业名称'"
                placeholder-class="placeholder"
              />
            </view>
            <view v-if="order._titleType === 'ENTERPRISE'" class="form-group">
              <text class="form-label">税号</text>
              <input
                class="form-input"
                v-model="order._taxNo"
                placeholder="请输入企业税号"
                placeholder-class="placeholder"
              />
            </view>
            <view class="form-group">
              <text class="form-label">接收邮箱</text>
              <input
                class="form-input"
                v-model="order._email"
                placeholder="请输入邮箱地址"
                placeholder-class="placeholder"
              />
            </view>
            <view class="amount-row">
              <text class="amount-label">开票金额</text>
              <text class="amount-value">¥{{ formatPrice(order.total_amount) }}</text>
            </view>
            <text class="note">电子普通发票 · 开具后不可修改</text>
            <view class="submit-btn-wrap">
              <button
                class="submit-btn"
                :loading="order._submitting"
                :disabled="order._submitting"
                @tap="submitInvoice(order)"
              >
                <text class="submit-text">提交开票申请</text>
              </button>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 我的发票 Tab -->
    <scroll-view v-else scroll-y class="content">
      <view v-if="invoiceList.length === 0" class="empty-wrap">
        <EmptyState text="暂无发票记录" icon="📄" />
      </view>
      <view v-else class="invoice-list">
        <view
          v-for="inv in invoiceList" :key="inv.id"
          class="invoice-item"
        >
          <view class="inv-info">
            <text class="inv-no">{{ inv.invoice_no }}</text>
            <text class="inv-title">{{ inv.invoice_title }} · ¥{{ formatPrice(inv.amount) }}</text>
          </view>
          <view class="inv-actions">
            <text class="status-tag" :class="statusClass(inv.status)">{{ statusLabel(inv.status) }}</text>
            <text v-if="inv.status === 'ISSUED'" class="download-link" @tap="downloadInvoice(inv.id)">下载</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getInvoiceList, getOrderInvoice, applyInvoice } from '../../api/invoice'
import EmptyState from '../../components/empty-state.vue'

const placeholder = 'https://cdn.rechang.com/placeholder.jpg'

const tabs = [
  { key: 'apply', label: '申请开票' },
  { key: 'list', label: '我的发票' }
]
const activeTab = ref('apply')

const invoiceableOrders = ref<any[]>([])
const invoiceList = ref<any[]>([])

onMounted(() => {
  loadInvoiceableOrders()
  loadInvoiceList()
})

async function loadInvoiceableOrders() {
  try {
    const orders: any = await getOrderInvoice(1)
    const list = Array.isArray(orders) ? orders : (orders?.list || [])
    invoiceableOrders.value = list.map((o: any) => ({
      ...o,
      _titleType: 'PERSONAL',
      _invoiceTitle: '',
      _taxNo: '',
      _email: '',
      _submitting: false
    }))
  } catch (e) {
    invoiceableOrders.value = []
  }
}

async function loadInvoiceList() {
  try {
    const data: any = await getInvoiceList()
    invoiceList.value = Array.isArray(data) ? data : (data?.list || [])
  } catch (e) {
    invoiceList.value = []
  }
}

async function submitInvoice(order: any) {
  if (!order._invoiceTitle?.trim()) {
    uni.showToast({ title: '请输入抬头名称', icon: 'none' })
    return
  }
  if (order._titleType === 'ENTERPRISE' && !order._taxNo?.trim()) {
    uni.showToast({ title: '请输入企业税号', icon: 'none' })
    return
  }
  if (!order._email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order._email)) {
    uni.showToast({ title: '请输入有效邮箱', icon: 'none' })
    return
  }

  order._submitting = true
  try {
    await applyInvoice(order.id, {
      titleType: order._titleType,
      invoiceTitle: order._invoiceTitle.trim(),
      taxNo: order._taxNo?.trim() || undefined,
      email: order._email.trim()
    })
    uni.showToast({ title: '开票成功', icon: 'success' })
    await loadInvoiceableOrders()
    await loadInvoiceList()
  } catch (e) {
    // handled by request util
  } finally {
    order._submitting = false
  }
}

function downloadInvoice(id: number) {
  uni.showToast({ title: 'PDF下载功能开发中', icon: 'none' })
}

function formatPrice(cents: number) {
  const yuan = cents / 100
  return Number.isInteger(yuan) ? yuan.toString() : yuan.toFixed(2)
}

function statusLabel(status: string) {
  const map: Record<string, string> = { PENDING: '开具中', ISSUED: '已开具', VOIDED: '已作废' }
  return map[status] || status
}

function statusClass(status: string) {
  if (status === 'ISSUED') return 'st-green'
  if (status === 'PENDING') return 'st-orange'
  return 'st-gray'
}
</script>

<style scoped>
.invoice-page {
  min-height: 100vh;
  background: #f5f5f5;
}
.segment {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #eef0f3;
}
.seg-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 26rpx;
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
  background: #FF6B35;
  border-radius: 4rpx;
}

.content { height: calc(100vh - 90rpx); }
.empty-wrap { padding-top: 120rpx; }

.card {
  margin: 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.order-info {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}
.poster {
  width: 96rpx;
  height: 128rpx;
  border-radius: 8rpx;
  background: #f0f0f0;
  flex-shrink: 0;
}
.order-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.perf-name { font-size: 28rpx; font-weight: 600; color: #222; }
.order-no { font-size: 22rpx; color: #999; }
.order-amount { font-size: 24rpx; color: #666; }
.status-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}
.st-green { background: #e8f5e9; color: #4caf50; }
.st-orange { background: #fff3e0; color: #ff9800; }
.st-gray { background: #f0f0f0; color: #999; }

.invoice-done {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}
.done-text { font-size: 24rpx; color: #4caf50; }
.download-link { font-size: 26rpx; color: #2563eb; }

.invoice-form {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}
.form-group {
  margin-bottom: 20rpx;
}
.form-label {
  font-size: 26rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}
.form-input {
  width: 100%;
  height: 72rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #222;
  box-sizing: border-box;
}
.placeholder { color: #bbb; }
.type-tags {
  display: flex;
  gap: 12rpx;
}
.type-tag {
  padding: 8rpx 32rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  background: #f0f0f0;
  color: #666;
}
.type-tag.active {
  background: #FF6B35;
  color: #fff;
}
.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}
.amount-label { font-size: 26rpx; color: #666; }
.amount-value { font-size: 30rpx; font-weight: 700; color: #FF6B35; }
.note {
  font-size: 22rpx;
  color: #bbb;
  display: block;
  margin-top: 8rpx;
}
.submit-btn-wrap {
  margin-top: 24rpx;
}
.submit-btn {
  width: 100%;
  height: 88rpx;
  background: #FF6B35;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 88rpx;
  padding: 0;
  margin: 0;
}
.submit-btn::after { border: none; }
.submit-btn[disabled] { background: #ffb39a; }
.submit-text { font-size: 30rpx; font-weight: 600; color: #fff; }

.invoice-list {
  padding: 24rpx;
}
.invoice-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.inv-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.inv-no { font-size: 26rpx; color: #333; }
.inv-title { font-size: 22rpx; color: #999; }
.inv-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
</style>
