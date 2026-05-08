import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import axios from 'axios'

export const useForgotPassword = () => {
  return useMutation<any, Error, string>({
    mutationFn: (email) => authService.forgotPassword(email),

    onSuccess: () => {
      alert('Kode verifikasi telah dikirim ke email Anda.')
    },

    onError: (err: any) => {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Gagal mengirim kode.')
      }
      throw new Error('An unexpected error occurred.')
    },
  })
}
