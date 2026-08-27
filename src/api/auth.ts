import { request } from '../utils/request'

export function login(code: string, nickname: string, avatarUrl: string) {
  return request({
    url: '/api/auth/login',
    method: 'POST',
    data: { code, nickname, avatar_url: avatarUrl }
  })
}

export function bindPhone(phone: string) {
  return request({ url: '/api/auth/phone', method: 'POST', data: { phone } })
}

export function submitRealname(idCardFrontUrl: string, idCardBackUrl: string, faceImageUrl: string) {
  return request({
    url: '/api/auth/realname', method: 'POST',
    data: { id_card_front_url: idCardFrontUrl, id_card_back_url: idCardBackUrl, face_image_url: faceImageUrl }
  })
}

export function getRealnameStatus() {
  return request({ url: '/api/auth/realname/status', method: 'GET' })
}

export function getUserProfile() {
  return request({ url: '/api/user/profile', method: 'GET' })
}

export function updateUserProfile(nickname: string, avatarUrl: string) {
  return request({ url: '/api/user/profile', method: 'PUT', data: { nickname, avatar_url: avatarUrl } })
}
