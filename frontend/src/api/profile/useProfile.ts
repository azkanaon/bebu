import { useQuery } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'

export const useProfile = (username: string) => {
  return useQuery({
    queryKey: ['profile', username],

    queryFn: () => profileService.getProfile(username),

    enabled: !!username,

    staleTime: 1000 * 60 * 5,
  })
}
