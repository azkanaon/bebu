import { useInfiniteQuery } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'

export const useFollowRequests = () => {
  return useInfiniteQuery({
    queryKey: ['follow-requests'],
    queryFn: ({ pageParam = 1 }) =>
      profileService.getFollowRequests(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1
      }
      return undefined
    },
  })
}
