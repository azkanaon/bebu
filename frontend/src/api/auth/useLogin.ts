import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { LoginRequest, LoginResponse } from '@/types/auth'
import { useMutation } from '@tanstack/react-query'

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const router = useRouter()

  return useMutation<LoginResponse, Error, LoginRequest>({
    // 1. Fungsi penembak API
    mutationFn: (payload) => authService.login(payload),

    // 2. Jika sukses (Otomatis simpan ke Zustand & Redirect)
    onSuccess: (response) => {
      setAuth(response.data)
      router.push('/profile')
    },

    // 3. Modifikasi pesan error agar rapi (Sesuai kodemu sebelumnya)
    onError: (err: any) => {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          throw new Error(
            'Terlalu banyak percobaan login. Silakan tunggu beberapa saat lagi.',
          )
        }
        throw new Error(err.response?.data?.message || 'Login failed.')
      }
      throw new Error('An unexpected error occurred.')
    },
  })
}
