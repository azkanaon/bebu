import api from '@/lib/axios'
import { PostPaginationResponse } from '@/types/user-posts'

export const postService = {
  getUserPosts: async (
    username: string,
    page: number,
    limit: number = 5,
  ): Promise<PostPaginationResponse> => {
    const res = await api.get<PostPaginationResponse>(
      `/v1/users/${username}/posts`,
      {
        params: { page, limit },
      },
    )
    return res.data
  },

  getUserSaves: async (
    username: string,
    page: number,
    limit: number = 5,
  ): Promise<PostPaginationResponse> => {
    const res = await api.get<PostPaginationResponse>(
      `/v1/users/${username}/saves`,
      {
        params: { page, limit },
      },
    )
    return res.data
  },

  getUserLikes: async (
    username: string,
    page: number,
    limit: number = 5,
  ): Promise<PostPaginationResponse> => {
    const res = await api.get<PostPaginationResponse>(
      `/v1/users/${username}/likes`,
      {
        params: { page, limit },
      },
    )
    return res.data
  },
}
