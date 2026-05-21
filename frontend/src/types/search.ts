export interface SearchUser {
  id: number
  username: string
  displayName: string
  avatarUrl: string
  isFollowing: boolean
}

export interface SearchBook {
  id: number
  title: string
  author: string
  coverUrl: string
  rating: number
}

export interface SearchPost {
  id: number
  authorName: string
  content: string
  likes: number
  createdAt: string
}
