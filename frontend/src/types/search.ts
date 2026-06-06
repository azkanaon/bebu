import { ViewerContext } from './profile'

// --- SUB TYPES ---
export interface SearchUser {
  username: string
  displayName: string
  avatarUrl: string
  viewerContext: ViewerContext
}

export interface SearchBook {
  public_id: string
  title: string
  synopsis: string
  cover_img_url: string
  publication_year: number
  language: string
  authors: string[]
  genres: string[] | null
  total_pages: number
  rating: number
  slug: string
}

export interface SearchPost {
  publicId: string
  description: string
  postType: string
  rating: number
  publishedAt: string
  stats: {
    likeCount: number
    commentCount: number
    saveCount: number
  }
}

export interface SearchHistory {
  id: number
  query: string
}

// --- RESPONSE TYPES ---
export interface TopSearchResponse {
  data: {
    books: SearchBook[]
    users: SearchUser[]
    posts: SearchPost[]
  }
}

export interface PaginatedSearchResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}
