export type PostType = 'review' | 'analysis'

export interface PostBook {
  publicId: string
  title: string
  coverImgUrl: string
  totalPages: number
  authors: string[]
}

export interface PostStats {
  likeCount: number
  commentCount: number
  saveCount: number
}

export interface User {
  username: string
  displayName: string
  avatarUrl: string
}

export interface UserPost {
  publicId: string
  description: string
  postType: PostType
  rating: number
  publishedAt: string
  stats: PostStats
  book: PostBook
  user: User
  is_liked: boolean // Mengikuti snake_case dari JSON kamu
  is_saved: boolean
}

export interface PostPaginationResponse {
  data: UserPost[]
  meta: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}
