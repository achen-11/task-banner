import request from '@/utils/request'
import type { LoginRequest, LoginResponse, RegisterRequest, UserInfo } from '@/types/auth'

const API_BASE = '/api/auth'

export const authApi = {
  login: (data: LoginRequest) =>
    request.post(`${API_BASE}/login`, data) as Promise<LoginResponse>,

  register: (data: RegisterRequest) =>
    request.post(`${API_BASE}/register`, data) as Promise<LoginResponse>,

  logout: () =>
    request.post(`${API_BASE}/logout`) as Promise<null>,

  getCurrentUser: () =>
    request.get(`${API_BASE}/me`) as Promise<UserInfo>,

  koobooLogin: () =>
    request.post(`${API_BASE}/kooboo-login`, {}) as Promise<LoginResponse>
}
