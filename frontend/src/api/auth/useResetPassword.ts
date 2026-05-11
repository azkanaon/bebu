import { useMutation } from '@tanstack/react-query'
import { authService, ResetPasswordPayload } from '@/services/auth.service'
import axios from 'axios'

export const useResetPassword = () => {
  return useMutation<any, Error, ResetPasswordPayload>({
    mutationFn: (payload) => authService.resetPassword(payload),

    onSuccess: () => {
      alert('Kata sandi berhasil diatur ulang!')
      // Catatan: onSuccess modal close akan kita tangani di Komponen UI
    },

    onError: (err: any) => {
      if (axios.isAxiosError(err)) {
        throw new Error(
          err.response?.data?.message || 'Gagal mengatur ulang kata sandi.',
        )
      }
      throw new Error('An unexpected error occurred.')
    },
  })
}
