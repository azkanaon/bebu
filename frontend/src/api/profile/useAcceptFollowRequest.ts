import { useMutation } from '@tanstack/react-query'

import { profileService } from '@/services/profile.service'

export const useAcceptFollowRequest = () => {
  return useMutation({
    mutationFn: (username: string) =>
      profileService.acceptFollowRequest(username),
  })
}
