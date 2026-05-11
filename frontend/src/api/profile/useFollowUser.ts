import { useMutation } from '@tanstack/react-query'

import { profileService } from '@/services/profile.service'

export const useFollowUser = () => {
  return useMutation({
    mutationFn: (username: string) => profileService.followUser(username),
  })
}
