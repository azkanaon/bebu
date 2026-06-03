export interface AuthorInput {
  id?: number
  name?: string
}

export interface GenreInput {
  id?: number
  name?: string
}

// Interface untuk Request ke Backend
export interface BookSubmissionRequest {
  title: string
  synopsis?: string
  authors: AuthorInput[] // Array of mixed ID/Name
  genres: GenreInput[] // Array of mixed ID/Name
  language?: string
  isbn?: string
  total_pages?: number
  publication_year?: number
  user_note?: string
  cover?: File | null
  remove_cover?: boolean
}

export interface SubmissionResponse {
  message: string
}

export interface SearchResultItem {
  id: number
  name: string
}

export interface AuthorInput {
  id?: number
  name?: string
}

export interface GenreInput {
  id?: number
  name?: string
}

export interface BookSubmissionRequest {
  title: string
  authors: AuthorInput[]
  genres: GenreInput[]
  synopsis?: string
  language?: string
  isbn?: string
  total_pages?: number
  publication_year?: number
  user_note?: string
  cover?: File | null
}
export interface SearchResultItem {
  id: number
  name: string
}

export interface AuthorInput {
  id?: number
  name?: string
}

export interface GenreInput {
  id?: number
  name?: string
}

export interface BookSubmissionRequest {
  title: string
  authors: AuthorInput[]
  genres: GenreInput[]
  synopsis?: string
  language?: string
  isbn?: string
  total_pages?: number
  publication_year?: number
  user_note?: string
  cover?: File | null
}

export interface MySubmissionItem {
  id: number
  title: string
  status: 'pending' | 'approved' | 'rejected'
  coverImgUrl: string | null
  userNote: string | null
  adminNote: string | null
  publicationYear: number | null
  authors: string[]
  genres: string[]
  createdAt: string
  updatedAt: string
}

export interface MySubmissionsResponse {
  data: MySubmissionItem[]
  meta: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}
