import api from '@/lib/axios'
import {
  BookSubmissionRequest,
  MySubmissionsResponse,
  SearchResultItem,
} from '@/types/submission'

export const submissionService = {
  searchAuthors: async (q: string): Promise<{ data: SearchResultItem[] }> => {
    const res = await api.get('/v1/search/authors', { params: { q } })
    return res.data
  },

  searchGenres: async (q: string): Promise<{ data: SearchResultItem[] }> => {
    const res = await api.get('/v1/search/genres', { params: { q } })
    return res.data
  },

  submitBook: async (data: BookSubmissionRequest) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('authors', JSON.stringify(data.authors))
    formData.append('genres', JSON.stringify(data.genres))
    if (data.synopsis) formData.append('synopsis', data.synopsis)
    if (data.language) formData.append('language', data.language)
    if (data.isbn) formData.append('isbn', data.isbn)
    if (data.total_pages)
      formData.append('total_pages', String(data.total_pages))
    if (data.publication_year)
      formData.append('publication_year', String(data.publication_year))
    if (data.user_note) formData.append('user_note', data.user_note)
    if (data.cover) formData.append('cover', data.cover)

    return (await api.post('/v1/submissions', formData)).data
  },

  getMySubmissions: async (
    page: number,
    status: string = 'pending',
  ): Promise<MySubmissionsResponse> => {
    const res = await api.get<MySubmissionsResponse>('/v1/submissions/my', {
      params: {
        status,
        page,
        limit: 10,
      },
    })
    return res.data
  },

  deleteSubmission: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/v1/submissions/${id}`)
    return res.data
  },
}
