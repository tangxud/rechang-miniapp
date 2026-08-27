import { request } from '../utils/request'

export function getInvoiceList(status?: string) {
  const query = status ? `?status=${status}` : ''
  return request({ url: `/api/invoices${query}`, method: 'GET' })
}

export function getOrderInvoice(orderId: number) {
  return request({ url: `/api/orders/${orderId}/invoice`, method: 'GET' })
}

export function applyInvoice(orderId: number, data: {
  titleType: string
  invoiceTitle: string
  taxNo?: string
  email: string
}) {
  return request({ url: `/api/orders/${orderId}/invoice`, method: 'POST', data })
}
