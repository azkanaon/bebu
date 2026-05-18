import api from '@/lib/axios'
import {
  BookshelfResponse,
  NotesResponse,
  ReadingStatsResponse,
  UpdateProgressRequest,
  AddBookRequest,
  NoteRequest,
  CommonMessageResponse,
  ReadingStats,
  NoteType,
  ShelfStatus,
} from '@/types/bookshelf'

export const bookshelfService = {
  // Ambil semua buku di rak user
  getBookshelves: async (
    username: string,
    page: number,
    limit: number,
    status?: ShelfStatus, // Tambahkan status
  ): Promise<BookshelfResponse> => {
    const res = await api.get<BookshelfResponse>(
      `/v1/users/${username}/bookshelves`,
      {
        params: { page, limit, status }, // status akan jadi ?status=...
      },
    )
    return res.data
  },

  // Tambah buku ke rak
  addBookToShelf: async (
    payload: AddBookRequest,
  ): Promise<CommonMessageResponse> => {
    const res = await api.post<CommonMessageResponse>(
      '/v1/bookshelves',
      payload,
    )
    return res.data
  },

  // Update progress halaman dan status rak
  updateProgress: async (
    id: number,
    payload: UpdateProgressRequest,
  ): Promise<CommonMessageResponse> => {
    const res = await api.put<CommonMessageResponse>(
      `/v1/bookshelves/${id}`,
      payload,
    )
    return res.data
  },

  // Hapus buku dari rak
  removeBook: async (id: number): Promise<CommonMessageResponse> => {
    const res = await api.delete<CommonMessageResponse>(`/v1/bookshelves/${id}`)
    return res.data
  },

  // Ambil catatan untuk satu buku tertentu
  getNotes: async (
    bookshelfId: number,
    page: number,
    limit: number,
    type?: NoteType, // Tambahkan type
  ): Promise<NotesResponse> => {
    const res = await api.get<NotesResponse>(
      `/v1/bookshelves/${bookshelfId}/notes`,
      {
        params: { page, limit, type }, // type akan jadi ?type=...
      },
    )
    return res.data
  },

  // Buat catatan baru
  createNote: async (
    bookshelfId: number,
    payload: NoteRequest,
  ): Promise<CommonMessageResponse> => {
    const res = await api.post<CommonMessageResponse>(
      `/v1/bookshelves/${bookshelfId}/notes`,
      payload,
    )
    return res.data
  },

  // Update catatan yang sudah ada
  updateNote: async (
    noteId: number,
    payload: NoteRequest,
  ): Promise<CommonMessageResponse> => {
    const res = await api.put<CommonMessageResponse>(
      `/v1/notes/${noteId}`,
      payload,
    )
    return res.data
  },

  // Hapus catatan
  deleteNote: async (noteId: number): Promise<CommonMessageResponse> => {
    const res = await api.delete<CommonMessageResponse>(`/v1/notes/${noteId}`)
    return res.data
  },

  // Ambil statistik streak membaca
  getReadingStats: async (username: string): Promise<ReadingStats> => {
    const res = await api.get<ReadingStatsResponse>(
      `/v1/users/${username}/reading-stats`,
    )
    return res.data.data
  },
}
