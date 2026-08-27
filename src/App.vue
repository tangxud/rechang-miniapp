<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useUserStore } from './stores/user'

onLaunch(() => {
  const userStore = useUserStore()
  userStore.restoreFromStorage()
})

onShow(() => {
  // App brought to foreground
})
</script>

<style>
page { background-color: #f5f5f5; font-family: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif; }
.container { padding: 20rpx; }
.text-primary { color: #FF6B35; }
.text-gray { color: #999; }
.bg-white { background: #fff; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 8rpx; }
.gap-3 { gap: 12rpx; }
.gap-4 { gap: 16rpx; }
.p-4 { padding: 16rpx; }
.px-4 { padding-left: 16rpx; padding-right: 16rpx; }
.py-4 { padding-top: 16rpx; padding-bottom: 16rpx; }
.mt-2 { margin-top: 8rpx; }
.mt-4 { margin-top: 16rpx; }
.mb-4 { margin-bottom: 16rpx; }
.rounded { border-radius: 12rpx; }
.rounded-lg { border-radius: 16rpx; }
.shadow { box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.08); }
.text-sm { font-size: 24rpx; }
.text-base { font-size: 28rpx; }
.text-lg { font-size: 32rpx; }
.text-xl { font-size: 36rpx; }
.text-2xl { font-size: 44rpx; }
.font-bold { font-weight: 700; }
.w-full { width: 100%; }
.overflow-hidden { overflow: hidden; }
</style>
