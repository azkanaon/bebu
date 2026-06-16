import { PostBook, UserPost } from './user-posts'

export type MessageType = 'text' | 'share_book' | 'share_post' | 'system'

export interface Conversation {
  id: number
  partnerName: string
  partnerAvatar: string
  lastMessage: string
  updatedAt: string
  unreadCount: number
  isGroup: boolean
}

export interface ChatMessage {
  id: number
  conversationId: number
  senderId: number
  body: string
  messageType: MessageType
  senderUsername?: string
  senderDisplayName?: string
  senderAvatar?: string
  createdAt: string
  // Field opsional tergantung messageType
  replyTo?: {
    id: number
    body: string
    senderName?: string
  }
  sharedBook?: PostBook
  sharedPost?: UserPost
}

export interface PaginationMeta {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
}

// Responses
export interface InboxResponse {
  data: Conversation[]
  meta: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

export interface MessagesResponse {
  data: ChatMessage[]
  meta: PaginationMeta
}

export interface SendMessageRequest {
  body: string
  conversation_id?: number // Digunakan jika chat sudah ada / Grup
  target_user_id?: number // Digunakan untuk chat pertama kali (DM)
  parent_message_id?: number // Digunakan untuk Reply
  post_id?: number // Digunakan untuk Share Post
  book_id?: number // Digunakan untuk Share Book
}

export interface SearchMessageResult extends ChatMessage {
  partnerName?: string
  partnerAvatar?: string
}

// Responses
export interface SearchConversationsResponse {
  data: Conversation[]
}

export interface SearchMessagesResponse {
  data: SearchMessageResult[]
}
