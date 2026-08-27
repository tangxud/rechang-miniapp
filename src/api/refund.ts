import { request } from '../utils/request'

export function previewRefund(orderId: number, ticketId: number) {
  return request({ url: `/api/orders/${orderId}/tickets/${ticketId}/refund/preview`, method: 'GET' })
}

export function refundTicket(orderId: number, ticketId: number, reason: string) {
  return request({ url: `/api/orders/${orderId}/tickets/${ticketId}/refund`, method: 'POST', data: { reason } })
}

export function refundForceMajeure(orderId: number, ticketId: number, reason: string, evidenceUrls: string[]) {
  return request({ url: `/api/orders/${orderId}/tickets/${ticketId}/refund/force-majeure`, method: 'POST', data: { reason, evidenceUrls: evidenceUrls } })
}

export function getRefundRecords(orderId: number) {
  return request({ url: `/api/orders/${orderId}/refund/record`, method: 'GET' })
}
