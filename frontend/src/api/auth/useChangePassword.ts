import { authService } from '@/services/auth.service'
import { ChangePasswordRequest, ChangePasswordResponse } from '@/types/auth'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AxiosError } from 'axios'

interface ErrorResponse {
  message: string
}

export const useChangePassword = () => {
  return useMutation<
    ChangePasswordResponse,
    AxiosError<ErrorResponse>,
    ChangePasswordRequest
  >({
    mutationFn: (payload) => authService.changePassword(payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Password changed successfully!')
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || 'Failed to change password'
      toast.error(message)
    },
  })
}
