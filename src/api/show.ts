import { request } from '../utils/request'

export function getShowList(params: Record<string, any>) {
  const query = Object.entries(params).filter(([_,v]) => v != null && v !== '').map(([k,v]) => `${k}=${v}`).join('&')
  return request({ url: `/api/shows?${query}`, method: 'GET' })
}

export function getRanking(period: string, city: string, limit: number) {
  return request({ url: `/api/shows/ranking?period=${period}&city=${city||''}&limit=${limit}`, method: 'GET' })
}

export function getNearby(lat: number, lng: number, radius: number, page: number, size: number) {
  return request({ url: `/api/shows/nearby?lat=${lat}&lng=${lng}&radius=${radius}&page=${page}&size=${size}`, method: 'GET' })
}

export function getShowDetail(id: number) {
  return request({ url: `/api/shows/${id}`, method: 'GET' })
}

export function toggleSubscribe(id: number, subType: string) {
  return request({ url: `/api/shows/${id}/subscribe`, method: 'POST', data: { sub_type: subType } })
}

export function toggleWant(id: number) {
  return request({ url: `/api/shows/${id}/want`, method: 'POST' })
}

export function getWantCount(id: number) {
  return request({ url: `/api/shows/${id}/want/count`, method: 'GET' })
}
