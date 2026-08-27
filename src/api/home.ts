import { request } from '../utils/request'

export function getHomeData() {
  return request({ url: '/api/home', method: 'GET' })
}

export function searchSuggest(keyword: string) {
  return request({ url: `/api/search/suggest?keyword=${encodeURIComponent(keyword || '')}`, method: 'GET' })
}
