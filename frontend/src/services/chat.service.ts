import api from '@/lib/axios'
import {
  ChatMessage,
  InboxResponse,
  MessagesResponse,
  SearchConversationsResponse,
  SearchMessagesResponse,
  SendMessageRequest,
} from '@/types/chat'

export const chatService = {
  // Ambil daftar obrolan (Inbox)
  getInbox: async (
    page: number,
    limit: number = 15,
  ): Promise<InboxResponse> => {
    const res = await api.get<InboxResponse>('/v1/chats/conversations', {
      params: { page, limit },
    })
    return res.data
  },

  // Ambil pesan dalam satu obrolan (Infinite Scroll)
  getMessages: async (
    conversationId: number,
    page: number,
  ): Promise<MessagesResponse> => {
    const res = await api.get<MessagesResponse>(
      `/v1/chats/conversations/${conversationId}/messages`,
      {
        params: { page, limit: 20 },
      },
    )
    return res.data
  },

  // Tandai sebagai terbaca
  markAsRead: async (conversationId: number): Promise<{ message: string }> => {
    const res = await api.put(`/v1/chats/conversations/${conversationId}/read`)
    return res.data
  },

  sendMessage: async (payload: SendMessageRequest): Promise<ChatMessage> => {
    const res = await api.post<ChatMessage>('/v1/chats/send', payload)
    return res.data
  },

  searchConversations: async (
    q: string,
  ): Promise<SearchConversationsResponse> => {
    const res = await api.get<SearchConversationsResponse>(
      '/v1/search/chats/conversations',
      { params: { q } },
    )
    return res.data
  },

  // 2. Cari isi pesan di seluruh obrolan (Global)
  searchMessagesGlobal: async (q: string): Promise<SearchMessagesResponse> => {
    const res = await api.get<SearchMessagesResponse>(
      '/v1/search/chats/messages',
      { params: { q } },
    )
    return res.data
  },

  // 3. Cari pesan di dalam satu obrolan spesifik
  searchInConversation: async (
    id: number,
    q: string,
  ): Promise<SearchMessagesResponse> => {
    const res = await api.get<SearchMessagesResponse>(
      `/v1/chats/conversations/${id}/search`,
      { params: { q } },
    )
    return res.data
  },
}
