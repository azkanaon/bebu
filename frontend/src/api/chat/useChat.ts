import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
  useQuery,
} from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import {
  ChatMessage,
  InboxResponse,
  MessagesResponse,
  SearchConversationsResponse,
  SearchMessagesResponse,
  SendMessageRequest,
} from '@/types/chat'
import { useAuthStore } from '@/stores/useAuthStore'

interface SendMessageVariables {
  payload: SendMessageRequest
  replyingToData?: ChatMessage | null // Data pesan yang dibalas (hanya untuk UI)
}

// Hook untuk Inbox
export const useInfiniteInbox = () => {
  return useInfiniteQuery<InboxResponse, Error, InfiniteData<InboxResponse>>({
    queryKey: ['chat-inbox'],
    queryFn: ({ pageParam = 1 }) => chatService.getInbox(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
  })
}

// Hook untuk Pesan (Infinite Scroll)
export const useInfiniteMessages = (conversationId: number) => {
  return useInfiniteQuery<
    MessagesResponse,
    Error,
    InfiniteData<MessagesResponse>
  >({
    queryKey: ['chat-messages', conversationId],
    queryFn: ({ pageParam = 1 }) =>
      chatService.getMessages(conversationId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: !!conversationId,
  })
}

// Hook untuk Mark As Read
export const useMarkChatAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => chatService.markAsRead(id),
    onSuccess: () => {
      // Invalidate inbox agar angka unread menghilang
      queryClient.invalidateQueries({ queryKey: ['chat-inbox'] })
    },
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()

  return useMutation<ChatMessage, Error, SendMessageVariables>({
    // MutationFn tetap hanya mengirim payload ke server
    mutationFn: ({ payload }) => chatService.sendMessage(payload),

    onMutate: async ({ payload, replyingToData }) => {
      if (payload.conversation_id) {
        const queryKey = ['chat-messages', payload.conversation_id]
        await queryClient.cancelQueries({ queryKey })
        const previousMessages =
          queryClient.getQueryData<InfiniteData<MessagesResponse>>(queryKey)

        queryClient.setQueryData<InfiniteData<MessagesResponse>>(
          queryKey,
          (old) => {
            if (!old) return old
            const newPages = [...old.pages]

            const tempMsg: ChatMessage = {
              id: Math.random(),
              conversationId: payload.conversation_id!,
              senderId: 0,
              senderUsername: currentUser?.username || '',
              senderDisplayName: currentUser?.display_name || '',
              senderAvatar: currentUser?.avatar_url || '',
              body: payload.body,
              messageType: 'text',
              createdAt: new Date().toISOString(),
              // --- KUNCINYA DI SINI ---
              // Masukkan data reply ke pesan sementara agar langsung muncul di UI
              replyTo: replyingToData
                ? {
                    id: replyingToData.id,
                    body: replyingToData.body,
                    senderName: replyingToData.senderDisplayName,
                  }
                : undefined,
            }

            newPages[0] = {
              ...newPages[0],
              data: [tempMsg, ...newPages[0].data],
            }
            return { ...old, pages: newPages }
          },
        )

        return { previousMessages }
      }
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-inbox'] })
    },

    onSettled: (data) => {
      if (data?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['chat-messages', data.conversationId],
        })
      }
    },
  })
}

export const useSearchConversations = (q: string) => {
  return useQuery<SearchConversationsResponse, Error>({
    queryKey: ['search-chat-conv', q],
    queryFn: () => chatService.searchConversations(q),
    enabled: q.length >= 2,
  })
}

// Hook: Search Messages Global
export const useSearchMessagesGlobal = (q: string) => {
  return useQuery<SearchMessagesResponse, Error>({
    queryKey: ['search-chat-msg-global', q],
    queryFn: () => chatService.searchMessagesGlobal(q),
    enabled: q.length >= 2,
  })
}

export const useSearchInConversation = (id: number, q: string) => {
  return useQuery<SearchMessagesResponse, Error>({
    queryKey: ['search-chat-msg-local', id, q],
    queryFn: () => chatService.searchInConversation(id, q),
    // Pencarian aktif jika query minimal 2 karakter
    enabled: q.length >= 2 && !!id,
  })
}
