// #ifdef H5
const BASE_URL = ''  // H5: requests go through Vite proxy
// #endif
// #ifndef H5
const BASE_URL = 'http://localhost:8080'  // MP: direct request
// #endif

interface ApiResult<T = any> {
  code: number
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
  data: T
}

export function request<T = any>(options: UniApp.RequestOptions): Promise<T> {
  const token = uni.getStorageSync('token')
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.header as Record<string, string> || {})
  }
  if (token) header['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: BASE_URL + options.url,
      header,
      success: (res) => {
        const data = res.data as ApiResult<T>
        if (data.level === 'INFO' || data.code === 200) {
          resolve(data.data)
        } else if (data.code === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('userId')
          uni.reLaunch({ url: '/pages/profile/login' })
          reject(new Error(data.message))
        } else if (data.level === 'WARN') {
          uni.showToast({ title: data.message, icon: 'none' })
          reject(new Error(data.message))
        } else {
          uni.showToast({ title: data.message, icon: 'error' })
          reject(new Error(data.message))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

export { BASE_URL }
