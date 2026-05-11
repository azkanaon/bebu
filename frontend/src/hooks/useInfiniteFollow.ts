import { useInfiniteQuery } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'

export const useInfiniteFollowers = (username: string) => {
  return useInfiniteQuery({
    queryKey: ['followers', username],
    queryFn: ({ pageParam = 1 }) =>
      profileService.getFollowers(username, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1
      }
      return undefined
    },
    enabled: !!username,
  })
}

export const useInfiniteFollowing = (username: string) => {
  return useInfiniteQuery({
    queryKey: ['following', username],
    queryFn: ({ pageParam = 1 }) =>
      profileService.getFollowing(username, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1
      }
      return undefined
    },
    enabled: !!username,
  })
}
