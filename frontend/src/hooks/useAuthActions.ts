// src/hooks/useAuthActions.ts
import { useState } from 'react'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/useAuthStore'
import { LoginRequest, RegisterRequest } from '@/types/auth'
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

  const register = async (payload: RegisterRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      await authService.register(payload)
      alert('Registration Successful! Please Login.')
      router.push('/login')
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Registration failed.')
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await authService.forgotPassword(email)
      alert('Kode verifikasi telah dikirim ke email Anda.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim kode.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (payload: any, onSuccess: () => void) => {
    setIsLoading(true)
    setError(null)
    try {
      await authService.resetPassword(payload)
      alert('Kata sandi berhasil diatur ulang!')
      onSuccess() // Tutup modal
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Gagal mengatur ulang kata sandi.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
    isLoading,
    error,
    setError,
  }
}
