import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import { LoginRequest, LoginResponse } from '@/types/auth'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/get-error-login-message'

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const router = useRouter()

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (payload) => authService.login(payload),

    // Munculkan toast saat mulai loading (Opsional, tapi bagus untuk UX)
    onMutate: () => {
      // toast.loading('Sedang masuk...') // Jika ingin ada loading toast
    },

    onSuccess: (response) => {
      // Simpan data user ke Zustand
      setAuth(response.data)

      // Tampilkan pesan sukses
      toast.success('Login Berhasil!', {
        description: 'Selamat datang kembali.',
      })

      // Redirect ke halaman profile
      router.push('/profile')
    },

    onError: (error) => {
      // Gunakan helper getErrorMessage kamu di sini
      const message = getErrorMessage(error)

      toast.error('Login Gagal', {
        description: message,
      })
    },
  })
}
