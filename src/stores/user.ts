import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserProfile, updateUserProfile as updateUserProfileApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userId = ref<number | null>(null)
  const nickname = ref<string>('')
  const avatarUrl = ref<string>('')
  const phone = ref<string>('')
  const realnameStatus = ref<string>('') // PENDING/APPROVED/REJECTED
  const needPhone = ref<boolean>(false)
  const needRealname = ref<boolean>(false)

  const isLoggedIn = computed(() => !!token.value)

  async function login(code: string, _nickname: string, _avatarUrl: string) {
    const data: any = await loginApi(code, _nickname, _avatarUrl)
    token.value = data.token
    userId.value = data.user_id
    nickname.value = data.nickname || _nickname
    avatarUrl.value = data.avatar_url || _avatarUrl
    phone.value = data.phone || ''
    realnameStatus.value = data.realname_status || ''
    needPhone.value = !!data.need_phone
    needRealname.value = !!data.need_realname

    uni.setStorageSync('token', token.value)
    uni.setStorageSync('userId', userId.value)
    uni.setStorageSync('nickname', nickname.value)
    uni.setStorageSync('avatarUrl', avatarUrl.value)
  }

  function restoreFromStorage() {
    const _token = uni.getStorageSync('token')
    const _userId = uni.getStorageSync('userId')
    const _nickname = uni.getStorageSync('nickname')
    const _avatarUrl = uni.getStorageSync('avatarUrl')
    if (_token) {
      token.value = _token
      userId.value = _userId ?? null
      nickname.value = _nickname || ''
      avatarUrl.value = _avatarUrl || ''
      // Refresh full profile from server in background
      fetchProfile().catch(() => {})
    }
  }

  async function fetchProfile() {
    const data: any = await getUserProfile()
    nickname.value = data.nickname || nickname.value
    avatarUrl.value = data.avatar_url || avatarUrl.value
    phone.value = data.phone || ''
    realnameStatus.value = data.realname_status || ''
    needPhone.value = !!data.need_phone
    needRealname.value = !!data.need_realname
    if (userId.value == null) userId.value = data.user_id ?? null
  }

  async function updateProfile(_nickname: string, _avatarUrl: string) {
    await updateUserProfileApi(_nickname, _avatarUrl)
    nickname.value = _nickname
    avatarUrl.value = _avatarUrl
    uni.setStorageSync('nickname', _nickname)
    uni.setStorageSync('avatarUrl', _avatarUrl)
  }

  function logout() {
    token.value = ''
    userId.value = null
    nickname.value = ''
    avatarUrl.value = ''
    phone.value = ''
    realnameStatus.value = ''
    needPhone.value = false
    needRealname.value = false
    uni.removeStorageSync('token')
    uni.removeStorageSync('userId')
    uni.removeStorageSync('nickname')
    uni.removeStorageSync('avatarUrl')
  }

  return {
    token,
    userId,
    nickname,
    avatarUrl,
    phone,
    realnameStatus,
    needPhone,
    needRealname,
    isLoggedIn,
    login,
    restoreFromStorage,
    fetchProfile,
    updateProfile,
    logout
  }
})
