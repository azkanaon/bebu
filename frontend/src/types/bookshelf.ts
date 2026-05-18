export type ShelfStatus = 'reading' | 'want_to_read' | 'done'
export type NoteType = 'insight' | 'quote' | 'summary'

export interface PaginationMeta {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
}

export interface Book {
  publicId: string
  title: string
  coverImgUrl: string
  totalPages: number
  authors: string[]
}

export interface BookshelfItem {
  id: number
  publicId: string
  book: Book
  shelfStatus: ShelfStatus
  progress: number
  currentPage: number
  startedAt: string
  finishedAt?: string
}

export interface Note {
  id: number
  type: NoteType
  pageStart: number | null
  pageEnd: number | null
  description: string
  createdAt: string
}

export interface ReadingStats {
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
}

// --- Request DTOs (Data Transfer Objects) ---

export interface UpdateProgressRequest {
  shelf_status: ShelfStatus
  current_page: number
}

export interface AddBookRequest {
  book_id: number
  shelf_status: ShelfStatus
}

export interface NoteRequest {
  type: NoteType
  page_start?: number
  page_end?: number
  description: string
}

// --- Response DTOs ---

export interface BookshelfResponse {
  data: BookshelfItem[]
  meta: PaginationMeta
}

export interface NotesResponse {
  bookshelf: {
    title: string
    authors: string[]
    coverImgUrl: string
    progress: number
    currentPage: number
    totalPages: number
  }
  data: Note[]
  meta: PaginationMeta
}

export interface ReadingStatsResponse {
  data: ReadingStats
}

export interface CommonMessageResponse {
  message: string
}
