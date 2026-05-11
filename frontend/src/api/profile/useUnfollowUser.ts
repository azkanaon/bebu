import { useMutation } from '@tanstack/react-query'

import { profileService } from '@/services/profile.service'

export const useUnfollowUser = () => {
  return useMutation({
    mutationFn: (username: string) => profileService.unfollowUser(username),
  })
}
