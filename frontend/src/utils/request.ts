/**
 * HTTP 请求工具
 */
import axios, { type AxiosInstance } from 'axios'
import { getAuthToken, logout } from './auth'

const isDevelopment = import.meta.env.DEV

const request: AxiosInstance = axios.create({
  baseURL: "/",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

request.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const data = response.data

    if (data.code !== undefined) {
      if (data.code === 200) {
        return data.data
      }

      if (data.code === 401) {
        if (!isDevelopment) {
          logout()
        }
        return Promise.reject(new Error(data.message || 'Unauthorized'))
      }

      return Promise.reject(new Error(data.message || 'Request failed'))
    }

    return response.data
  },
  (error) => {
    if (error.response?.status === 401 && !isDevelopment) {
      logout()
    }
    const message = error.response?.data?.message || error.message || 'Network error'
    return Promise.reject(new Error(message))
  }
)

export default request
