import api from '@/lib/axios'
import {
  TopSearchResponse,
  PaginatedSearchResponse,
  SearchUser,
  SearchBook,
  SearchPost,
  SearchHistory,
} from '@/types/search'

export const searchService = {
  getTopResults: async (q: string): Promise<TopSearchResponse> => {
    const res = await api.get<TopSearchResponse>('/v1/search/top', {
      params: { q },
    })
    return res.data
  },

  searchUsers: async (
    q: string,
    page: number,
  ): Promise<PaginatedSearchResponse<SearchUser>> => {
    const res = await api.get<PaginatedSearchResponse<SearchUser>>(
      '/v1/search/users',
      {
        params: { q, page, limit: 12 },
      },
    )
    return res.data
  },

  searchBooks: async (
    q: string,
    page: number,
  ): Promise<PaginatedSearchResponse<SearchBook>> => {
    const res = await api.get<PaginatedSearchResponse<SearchBook>>(
      '/v1/search/books',
      {
        params: { q, page, limit: 12 },
      },
    )
    return res.data
  },

  searchPosts: async (
    q: string,
    page: number,
  ): Promise<PaginatedSearchResponse<SearchPost>> => {
    const res = await api.get<PaginatedSearchResponse<SearchPost>>(
      '/v1/search/posts',
      {
        params: { q, page, limit: 12 },
      },
    )
    return res.data
  },

  // HISTORY
  getHistory: async (): Promise<{ data: SearchHistory[] }> => {
    const res = await api.get('/v1/search/history')
    return res.data
  },

  deleteHistoryItem: async (id: number) => {
    return await api.delete(`/v1/search/history/${id}`)
  },

  clearAllHistory: async () => {
    return await api.delete('/v1/search/history/all')
  },
}
