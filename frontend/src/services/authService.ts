// src/services/authService.ts
import api from '@/lib/axios'
import { LoginRequest, LoginResponse } from '@/types/auth'

export const authService = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    // Axios otomatis throw error jika status code bukan 2xx
    const response = await api.post<LoginResponse>('/v1/auth/login', payload)
    return response.data
  },

  // Contoh untuk Register (nanti akan pakai FormData untuk file)
  //   register: async (payload: FormData): Promise<any> => {
  //     const response = await api.post('/api/v1/auth/register', payload, {
  //       headers: { 'Content-Type': 'multipart/form-data' },
  //     })
  //     return response.data
  //   },
}
