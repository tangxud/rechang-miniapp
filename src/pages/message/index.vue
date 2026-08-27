<template>
  <view class="message">
    <EmptyState text="消息功能开发中" icon="💬" />
  </view>
</template>

<script setup lang="ts">
import EmptyState from '../../components/empty-state.vue'
</script>

<style scoped>
.message {
  min-height: 100vh;
  background: #f5f5f5;
}
</style>
