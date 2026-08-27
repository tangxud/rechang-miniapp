import { request } from '../utils/request'

export function getSeatMap(performanceId: number) {
  return request({ url: `/api/shows/${performanceId}/seats`, method: 'GET' })
}
