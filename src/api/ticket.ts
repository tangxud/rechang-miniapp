import { request } from '../utils/request'

export function getTicketList(status?: string) {
  const query = status ? `?status=${status}` : ''
  return request({ url: `/api/tickets${query}`, method: 'GET' })
}

export function getTicketQrcode(ticketId: number) {
  return request({ url: `/api/tickets/${ticketId}/qrcode`, method: 'GET' })
}

export function startTransfer(ticketId: number) {
  return request({ url: `/api/tickets/${ticketId}/transfer`, method: 'POST' })
}

export function previewTransfer(transferToken: string) {
  return request({ url: `/api/tickets/transfer/preview?transferToken=${transferToken}`, method: 'GET' })
}

export function claimTransfer(transferToken: string) {
  return request({ url: '/api/tickets/transfer/claim', method: 'POST', data: { transferToken } })
}
