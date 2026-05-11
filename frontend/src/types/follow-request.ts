export interface FollowRequestUser {
  username: string
  displayName: string
  avatarUrl: string
}

export interface FollowRequestMeta {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
}

export interface FollowRequestResponse {
  data: FollowRequestUser[]
  meta: FollowRequestMeta
}
