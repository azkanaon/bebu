// src/services/authService.ts
import api from '@/lib/axios'
import { LoginRequest, LoginResponse, RegisterRequest } from '@/types/auth'

export interface ResetPasswordPayload {
  token: string // Kode 6 digit
  new_password: string // Password baru
}

export const authService = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    // Axios otomatis throw error jika status code bukan 2xx
    const response = await api.post<LoginResponse>('/v1/auth/login', payload)
    return response.data
  },

  register: async (payload: RegisterRequest) => {
    // Karena ada file, kita harus pakai FormData
    const formData = new FormData()

    // Masukkan semua data ke FormData
    formData.append('username', payload.username)
    formData.append('email', payload.email)
    formData.append('password', payload.password)
    formData.append('display_name', payload.display_name)
    formData.append('bio', payload.bio)
    formData.append('gender', payload.gender)

    // Bagian Foto
    if (payload.avatar) {
      formData.append('avatar_url', payload.avatar)
    }

    const response = await api.post('/v1/auth/register', formData, {
      headers: {
        // Axios otomatis mengatur boundary jika kita kirim FormData
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/v1/password/forgot', { email })
    return response.data
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const response = await api.post('/v1/password/reset', payload)
    return response.data
  },
}
