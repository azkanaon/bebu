import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { searchService } from '@/services/search.service'

export const useTopSearch = (q: string) => {
  return useQuery({
    queryKey: ['search-top', q],
    queryFn: () => searchService.getTopResults(q),
    enabled: q.length >= 2,
  })
}

export const useInfiniteSearchUsers = (q: string) => {
  return useInfiniteQuery({
    queryKey: ['search-users', q],
    queryFn: ({ pageParam = 1 }) =>
      searchService.searchUsers(q, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: q.length >= 2,
  })
}

export const useInfiniteSearchBooks = (q: string) => {
  return useInfiniteQuery({
    queryKey: ['search-books', q],
    queryFn: ({ pageParam = 1 }) =>
      searchService.searchBooks(q, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: q.length >= 2,
  })
}

export const useInfiniteSearchPosts = (q: string) => {
  return useInfiniteQuery({
    queryKey: ['search-posts', q],
    queryFn: ({ pageParam = 1 }) =>
      searchService.searchPosts(q, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: q.length >= 2,
  })
}
