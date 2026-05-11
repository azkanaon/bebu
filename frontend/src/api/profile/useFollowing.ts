import { useQuery } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'

export const useFollowing = (username: string) => {
  return useQuery({
    queryKey: ['following', username], // Cache unik per username
    queryFn: () => profileService.getFollowing(username),
    enabled: !!username,
  })
}
