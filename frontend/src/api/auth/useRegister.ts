import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { RegisterRequest } from '@/types/auth'

export const useRegister = () => {
  const router = useRouter()

  return useMutation<any, Error, RegisterRequest>({
    mutationFn: (payload) => authService.register(payload),

    onSuccess: () => {
      alert('Registration Successful! Please Login.')
      router.push('/login')
    },

    onError: (err: any) => {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Registration failed.')
      }
      throw new Error('An unexpected error occurred.')
    },
  })
}
