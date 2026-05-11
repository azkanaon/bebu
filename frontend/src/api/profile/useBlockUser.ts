import { toast } from 'sonner'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/useAuthStore' // Ambil store untuk tahu username kita

export const useBlockUser = () => {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()

  return useMutation({
    mutationFn: (username: string) => api.post(`/v1/users/${username}/block`),

    onSuccess: (_, blockedUsername) => {
      // 1. Selalu invalidate profile orang yang di-block
      queryClient.invalidateQueries({ queryKey: ['profile', blockedUsername] })

      // 2. Selalu invalidate profile kita sendiri (karena total following/followers kita mungkin berubah)
      if (currentUser?.username) {
        queryClient.invalidateQueries({
          queryKey: ['profile', currentUser.username],
        })
      }

      // 3. Invalidate daftar followers & following si target
      // Kita lakukan ini tanpa syarat (unconditional) karena lebih aman
      // untuk memastikan UI benar-benar bersih setelah block.
      queryClient.invalidateQueries({
        queryKey: ['followers', blockedUsername],
      })
      queryClient.invalidateQueries({
        queryKey: ['following', blockedUsername],
      })

      // 4. Invalidate daftar followers & following kita sendiri juga
      queryClient.invalidateQueries({
        queryKey: ['followers', currentUser?.username],
      })
      queryClient.invalidateQueries({
        queryKey: ['following', currentUser?.username],
      })

      toast.success(`User blocked`)
    },
  })
}

export const useUnblockUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => api.delete(`/v1/users/${username}/block`),
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
      toast.success(`User unblocked`)
    },
  })
}
