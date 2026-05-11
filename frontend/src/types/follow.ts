export interface FollowResponse {
  message: string
  status: 'accepted' | 'pending'
}

export interface ViewerContext {
  isFollowing: boolean
  isFollowedBy: boolean
  isOwnProfile: boolean
  isPending: boolean
}

export interface FollowUserData {
  username: string
  displayName: string
  avatarUrl: string
  viewerContext: ViewerContext // Tambahkan ini
}

export interface PaginationMeta {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
}

export interface FollowListResponse {
  data: FollowUserData[]
  meta: PaginationMeta
}
