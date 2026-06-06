import api from '@/lib/axios'

export const booksService = {
  getBookBySlug: async (slug: string): Promise<{ title: string }> => {
    const res = await api.get(`/v1/books/title/${slug}`)

    return res.data
  },
}
