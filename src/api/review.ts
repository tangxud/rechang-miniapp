import { request } from '../utils/request'

export function getReviewList(performanceId: number, sortBy: string, page: number, size: number) {
  return request({ url: `/api/shows/${performanceId}/reviews?sortBy=${sortBy}&page=${page}&size=${size}`, method: 'GET' })
}

export function submitReview(performanceId: number, data: {
  rating: number
  tags?: string[]
  content?: string
  images?: string[]
  isAnonymous?: boolean
}) {
  return request({ url: `/api/shows/${performanceId}/reviews`, method: 'POST', data })
}

export function deleteReview(reviewId: number) {
  return request({ url: `/api/reviews/${reviewId}`, method: 'DELETE' })
}

export function toggleHelpful(reviewId: number) {
  return request({ url: `/api/reviews/${reviewId}/helpful`, method: 'POST' })
}

export function getReplies(reviewId: number, page: number, size: number) {
  return request({ url: `/api/reviews/${reviewId}/replies?page=${page}&size=${size}`, method: 'GET' })
}

export function submitReply(reviewId: number, content: string) {
  return request({ url: `/api/reviews/${reviewId}/replies`, method: 'POST', data: { content } })
}

export function reportReview(reviewId: number, reportType: string, reason: string) {
  return request({ url: `/api/reviews/${reviewId}/reports`, method: 'POST', data: { reportType: reportType, reason } })
}
