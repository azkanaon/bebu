import { useInfiniteQuery } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'

export const useInfiniteFollowers = (
  username: string,
  isEnabled: boolean = true,
) => {
  return useInfiniteQuery({
    queryKey: ['followers', username],
    queryFn: ({ pageParam = 1 }) =>
      profileService.getFollowers(username, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    // SEKARANG KITA PASANG DI SINI
    enabled: isEnabled && !!username,
  })
}

export const useInfiniteFollowing = (
  username: string,
  isEnabled: boolean = true,
) => {
  return useInfiniteQuery({
    queryKey: ['following', username],
    queryFn: ({ pageParam = 1 }) =>
      profileService.getFollowing(username, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: isEnabled && !!username,
  })
}
