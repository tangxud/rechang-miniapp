import { request } from '../utils/request'

export function getAttendeeList() {
  return request({ url: '/api/attendees', method: 'GET' })
}

export function createAttendee(name: string, idCardNo: string) {
  return request({ url: '/api/attendees', method: 'POST', data: { name, id_card_no: idCardNo } })
}

export function updateAttendee(id: number, name: string, idCardNo: string) {
  const data: Record<string, any> = { name }
  if (idCardNo) data.id_card_no = idCardNo
  return request({ url: `/api/attendees/${id}`, method: 'PUT', data })
}

export function deleteAttendee(id: number) {
  return request({ url: `/api/attendees/${id}`, method: 'DELETE' })
}
