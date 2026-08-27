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
      performance_id: data.performanceId,
      seat_ids: data.seatIds || [],
      standing_count: data.standingCount,
      attendees: data.attendees.map(a => ({ attendee_id: a.attendeeId }))
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
