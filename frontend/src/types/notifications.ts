// src/types/notification.ts

export type NotifType =
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'POST_SAVE'
  | 'COMMENT_LIKE'
  | 'COMMENT_REPLY'
  | 'FOLLOW_REQUEST'
  | 'FOLLOW_ACCEPT'
  | 'NEW_FOLLOWER'

// Ganti nama di sini
export interface AppNotification {
  id: number
  actorUsername: string
  actorDisplayName: string
  actorAvatar: string
  type: NotifType
  entityType: 'posts' | 'users' | 'comments'
  entityId: number
  extraActorsCount: number
  isRead: boolean
  createdAt: string
}

export interface NotificationResponse {
  data: AppNotification[] // Gunakan AppNotification
  meta: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

export interface UnreadCountResponse {
  data: {
    unreadCount: number
  }
}
