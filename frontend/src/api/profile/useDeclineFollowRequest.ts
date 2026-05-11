import { useMutation } from '@tanstack/react-query'

import { profileService } from '@/services/profile.service'

export const useDeclineFollowRequest = () => {
  return useMutation({
    mutationFn: (username: string) =>
      profileService.declineFollowRequest(username),
  })
}
