// src/lib/axios.ts
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Kamu bisa tambahkan interceptor di sini nanti untuk handle Token JWT
api.interceptors.request.use((config) => {
  // Contoh: ambil token dari localStorage jika ada
  const storage = localStorage.getItem('bebu-auth-storage')
  if (storage) {
    const { state } = JSON.parse(storage)
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`
    }
  }
  return config
})

export default api
