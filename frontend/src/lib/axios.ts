// src/lib/axios.ts
import axios, { AxiosError } from 'axios'
import Cookies from 'js-cookie'

// Buat instance Axios kustom
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  // Hanya tambahkan header untuk metode yang tidak aman
  if (
    config.method &&
    ['post', 'put', 'delete', 'patch'].includes(config.method)
  ) {
    // Baca token dari cookie 'csrf-token'
    const csrfToken = Cookies.get('csrf-token')

    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
  }
  return config
})

// Di sinilah "sihir" terjadi: Response Interceptor
// Fungsi ini akan menangani response dari backend
api.interceptors.response.use(
  // 1. Fungsi yang dijalankan jika response SUKSES (status 2xx)
  (response) => {
    // Jika sukses, tidak perlu melakukan apa-apa. Langsung kembalikan response.
    return response
  },

  // 2. Fungsi yang dijalankan jika response GAGAL (status bukan 2xx)
  async (error: AxiosError) => {
    // Pastikan error berasal dari Axios dan memiliki response
    if (!error.response) {
      return Promise.reject(error)
    }

    const originalRequest = error.config

    // Cek apakah errornya adalah 401 Unauthorized dan kita BELUM pernah mencoba refresh
    // untuk request ini. `_retry` adalah properti kustom untuk mencegah loop tak terbatas.
    if (
      error.response.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      ;(originalRequest as any)._retry = true // Tandai bahwa kita sudah mencoba refresh

      try {
        console.log('Access token expired. Attempting to refresh...')

        // Panggil endpoint /refresh. Kita tidak perlu mengirim body.
        // `withCredentials: true` di instance utama sudah cukup.
        await api.post('/v1/auth/refresh')

        console.log('Token refreshed successfully. Retrying original request.')

        // Jika refresh berhasil, kirim ulang request asli yang gagal.
        // Axios akan otomatis menggunakan cookie 'token' baru yang sudah di-set oleh backend.
        return api(originalRequest)
      } catch (refreshError) {
        console.error(
          'Failed to refresh token. Session may have expired.',
          refreshError,
        )

        return Promise.reject(refreshError)
      }
    }

    // Untuk semua error lain (selain 401), langsung tolak promise-nya.
    return Promise.reject(error)
  },
)

export default api
