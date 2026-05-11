import { useQuery } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'

export const useFollowers = (username: string) => {
  return useQuery({
    queryKey: ['followers', username], // Cache unik per username
    queryFn: () => profileService.getFollowers(username),
    enabled: !!username, // Hanya jalankan jika username ada
  })
}
