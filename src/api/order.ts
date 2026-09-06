import { request } from '../utils/request'

export function createOrder(data: {
  performanceId: number
  seatIds?: number[]
  standingCount?: number
  attendees: { attendeeId: number }[]
}) {
  return request({
    url: '/api/orders', method: 'POST',
    data: {
      performanceId: data.performanceId,
      seatIds: data.seatIds || [],
      standingCount: data.standingCount,
      attendees: data.attendees.map(a => ({ attendeeId: a.attendeeId }))
    }
  })
}

export function getOrderList(status?: string) {
  const query = status ? `?status=${status}` : ''
  return request({ url: `/api/orders${query}`, method: 'GET' })
}

export function getOrderDetail(id: number) {
  return request({ url: `/api/orders/${id}`, method: 'GET' })
}

/** 后端 PayParamsVO，camelCase 已对齐；package 为微信 SDK 固定字段名 */
export interface PayParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

export function payOrder(id: number) {
  return request<PayParams>({ url: `/api/orders/${id}/pay`, method: 'POST' })
}

export function cancelOrder(id: number) {
  return request({ url: `/api/orders/${id}/cancel`, method: 'POST' })
}

export interface PayStatus {
  status: string
  paid: boolean
}

export function getPayStatus(id: number) {
  return request<PayStatus>({ url: `/api/orders/${id}/pay/status`, method: 'GET' })
}
