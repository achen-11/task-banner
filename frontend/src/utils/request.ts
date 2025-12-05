/**
 * HTTP 请求工具 - 适配本地开发和 Kooboo 生产环境
 */
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { isLogin, logout, getCookie } from './auth'

const isDevelopment = import.meta.env.DEV

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 确保发送 cookie
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    if (isDevelopment) {
      // 开发模式：从 cookie 获取 jwt_token
      const token = getCookie('jwt_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    // 生产模式：Kooboo 会自动通过 cookie 处理认证

    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const data = response.data

    // 统一处理响应格式
    if (data.code !== undefined) {
      if (data.code === 200) {
        return data.data
      } else if (data.code === 401) {
        // 未授权
        console.error('Unauthorized (401):', data.message)

        // 开发模式下不自动退出登录，避免无限重定向
        if (!isDevelopment) {
          logout()
        } else {
          console.warn('⚠️ [Dev Mode] 401 Unauthorized - Please check your authentication')
        }

        return Promise.reject(new Error(data.message || 'Unauthorized'))
      } else {
        console.error('API Error:', data.message)
        return Promise.reject(new Error(data.message || 'Request failed'))
      }
    }

    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      if (status === 401) {
        // 未授权
        console.error('Unauthorized (401):', data?.message || 'Authentication required')

        // 开发模式下不自动退出登录，避免无限重定向
        if (!isDevelopment) {
          logout()
        } else {
          console.warn('⚠️ [Dev Mode] 401 Unauthorized - Please check your authentication')
        }
      } else if (status === 403) {
        console.error('Forbidden:', data?.message || 'Access denied')
      } else if (status === 404) {
        console.error('Not found:', error.config?.url)
      } else if (status >= 500) {
        console.error('Server error:', data?.message || 'Internal server error')
      }
    } else if (error.request) {
      console.error('Network error:', error.message)
    } else {
      console.error('Request error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default request
