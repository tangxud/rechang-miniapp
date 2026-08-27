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

export function payOrder(id: number) {
  return request({ url: `/api/orders/${id}/pay`, method: 'POST' })
}

export function cancelOrder(id: number) {
  return request({ url: `/api/orders/${id}/cancel`, method: 'POST' })
}

export function getPayStatus(id: number) {
  return request({ url: `/api/orders/${id}/pay/status`, method: 'GET' })
}
