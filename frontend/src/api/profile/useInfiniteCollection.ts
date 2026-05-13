import { useInfiniteQuery } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'

export const useInfiniteAchievements = (username: string) => {
  return useInfiniteQuery({
    queryKey: ['all-achievements', username],
    queryFn: ({ pageParam = 1 }) =>
      profileService.getAllAchievements(username, pageParam as number),
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

export const useInfiniteBadges = (username: string) => {
  return useInfiniteQuery({
    queryKey: ['all-badges', username],
    queryFn: ({ pageParam = 1 }) =>
      profileService.getAllBadges(username, pageParam as number),
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
