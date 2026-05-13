import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'
import { toast } from 'sonner'

export const useUpdateFavoriteBadges = (username: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileService.updateFavoriteBadges,
    onSuccess: () => {
      // Refresh data profile agar grid 4 di depan terupdate
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
    },
    onError: () => toast.error('Failed to update favorite badges'),
  })
}

export const useUpdateFavoriteAchievements = (username: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileService.updateFavoriteAchievements,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
    },
    onError: () => toast.error('Failed to update favorite achievements'),
  })
}
