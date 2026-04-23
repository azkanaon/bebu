// src/hooks/useAuthActions.ts
import { useState } from 'react'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/useAuthStore'
import { LoginRequest } from '@/types/auth'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setAuth = useAuthStore((state) => state.setAuth)
  const router = useRouter()

  const login = async (payload: LoginRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await authService.login(payload)
      setAuth(data)
      router.push('/profile')
    } catch (err: any) {
      // Penanganan error spesifik Axios
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            'Login failed. Please check your credentials.',
        )
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error }
}
