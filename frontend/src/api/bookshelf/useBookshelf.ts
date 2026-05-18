import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query'
import { bookshelfService } from '@/services/bookshelf.service'
import {
  BookshelfResponse,
  NotesResponse,
  ReadingStats,
  UpdateProgressRequest,
  CommonMessageResponse,
  NoteType,
  ShelfStatus,
  NoteRequest,
} from '@/types/bookshelf'
import { toast } from 'sonner'

// Hook untuk mendapatkan daftar buku (Infinite Scroll)
export const useInfiniteBookshelf = (username: string, status: ShelfStatus) => {
  return useInfiniteQuery<
    BookshelfResponse,
    Error,
    InfiniteData<BookshelfResponse>
  >({
    // QueryKey menyertakan status agar cache tidak tercampur
    queryKey: ['bookshelf', username, status],
    queryFn: ({ pageParam = 1 }) =>
      bookshelfService.getBookshelves(
        username,
        pageParam as number,
        12,
        status,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: !!username,
  })
}

// Hook Notes dengan Server-side Filtering
export const useInfiniteNotes = (bookshelfId: number, type?: NoteType) => {
  return useInfiniteQuery<NotesResponse, Error, InfiniteData<NotesResponse>>({
    queryKey: ['notes', bookshelfId, type], // Cache unik per tipe note
    queryFn: ({ pageParam = 1 }) =>
      bookshelfService.getNotes(bookshelfId, pageParam as number, 15, type),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: !!bookshelfId,
  })
}

// Hook untuk statistik streak
export const useReadingStats = (username: string) => {
  return useQuery<ReadingStats, Error>({
    queryKey: ['reading-stats', username],
    queryFn: () => bookshelfService.getReadingStats(username),
    enabled: !!username,
  })
}

// Hook Mutation untuk Update Progress Halaman
export const useUpdateBookProgress = (username: string) => {
  const queryClient = useQueryClient()

  return useMutation<
    CommonMessageResponse,
    Error,
    { id: number; payload: UpdateProgressRequest }
  >({
    mutationFn: ({ id, payload }) =>
      bookshelfService.updateProgress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookshelf', username] })
      queryClient.invalidateQueries({ queryKey: ['reading-stats', username] })
      queryClient.invalidateQueries({ queryKey: ['notes'] }) // Invalidate detail juga jika perlu
      toast.success('Progress updated successfully')
    },
  })
}

export const useUpdateNote = (bookshelfId: number) => {
  const queryClient = useQueryClient()
  return useMutation<
    CommonMessageResponse,
    Error,
    { noteId: number; payload: NoteRequest }
  >({
    mutationFn: ({ noteId, payload }) =>
      bookshelfService.updateNote(noteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', bookshelfId] })
      toast.success('Note updated successfully')
    },
  })
}

// Hook: Hapus Catatan
export const useDeleteNote = (bookshelfId: number) => {
  const queryClient = useQueryClient()
  return useMutation<CommonMessageResponse, Error, number>({
    mutationFn: (noteId) => bookshelfService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', bookshelfId] })
      toast.success('Note deleted')
    },
  })
}

// Hook: Hapus Buku dari Rak
export const useRemoveBook = (username: string) => {
  const queryClient = useQueryClient()
  return useMutation<CommonMessageResponse, Error, number>({
    mutationFn: (bookshelfId) => bookshelfService.removeBook(bookshelfId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookshelf', username] })
      toast.success('Book removed from bookshelf')
    },
  })
}
