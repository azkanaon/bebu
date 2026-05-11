import { useAuthStore } from '@/stores/useAuthStore'
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

// Tambahkan tipe agar tidak pakai 'any'
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor Request: Handle CSRF
api.interceptors.request.use((config) => {
  const unsafeMethods = ['post', 'put', 'delete', 'patch']
  if (config.method && unsafeMethods.includes(config.method.toLowerCase())) {
    const csrfToken = Cookies.get('csrf-token')
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
  }
  return config
})

// Variable untuk handle multiple refresh calls
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig

    if (!error.response || !originalRequest) {
      return Promise.reject(error)
    }

    const authRoutes = [
      '/v1/auth/login',
      '/v1/auth/register',
      '/v1/auth/refresh',
    ]
    const isAuthRoute = authRoutes.some((route) =>
      originalRequest.url?.includes(route),
    )

    // Jika 401 dan bukan route auth
    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      if (isRefreshing) {
        // Jika sedang ada proses refresh, masukkan request ini ke antrian
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/v1/auth/refresh')
        processQueue(null) // Jalankan antrian yang menunggu
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // INFO: Di sini kamu panggil action logout dari Zustand
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
