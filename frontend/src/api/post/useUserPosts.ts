import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import { postService } from '@/services/post.service'
import { PostPaginationResponse } from '@/types/user-posts'

export const useInfiniteUserPosts = (username: string) => {
  return useInfiniteQuery<
    PostPaginationResponse,
    Error,
    InfiniteData<PostPaginationResponse>
  >({
    queryKey: ['user-posts', username],
    queryFn: ({ pageParam = 1 }) =>
      postService.getUserPosts(username, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: !!username,
  })
}

export const useInfiniteUserSaves = (username: string) => {
  return useInfiniteQuery<
    PostPaginationResponse,
    Error,
    InfiniteData<PostPaginationResponse>
  >({
    queryKey: ['user-saves', username],
    queryFn: ({ pageParam = 1 }) =>
      postService.getUserSaves(username, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: !!username,
  })
}

export const useInfiniteUserLikes = (username: string) => {
  return useInfiniteQuery<
    PostPaginationResponse,
    Error,
    InfiniteData<PostPaginationResponse>
  >({
    queryKey: ['user-likes', username],
    queryFn: ({ pageParam = 1 }) =>
      postService.getUserLikes(username, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: !!username,
  })
}
