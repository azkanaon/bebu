import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'

export const useLogout = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const logoutStore = useAuthStore((state) => state.logout)

  return useMutation({
    // 1. Panggil API Logout di Golang
    mutationFn: () => authService.logout(),

    // 2. Gunakan onSettled (Artinya: Mau API-nya sukses atau gagal, kita tetap logout di client)
    // Ini lebih aman agar user tidak "terjebak" di akunnya jika server sedang bermasalah
    onSettled: () => {
      // A. Hapus data user di Zustand
      logoutStore()

      // B. PENTING: Hapus SEMUA cache TanStack Query
      // Agar saat user lain login di browser yang sama, dia tidak melihat data user sebelumnya
      queryClient.clear()

      // C. Redirect ke halaman login
      router.push('/login')
      router.refresh()
    },

    onError: (error) => {
      console.error('Logout error detail:', error)
    },
  })
}
