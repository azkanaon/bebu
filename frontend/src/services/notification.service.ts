import api from '@/lib/axios'
import {
  NotificationResponse,
  UnreadCountResponse,
} from '@/types/notifications'

export const notificationService = {
  getNotifications: async (page: number): Promise<NotificationResponse> => {
    const res = await api.get<NotificationResponse>('/v1/notifications', {
      params: { page, limit: 20 },
    })
    return res.data
  },
  markAllRead: async () => {
    return await api.put('/v1/notifications/read-all')
  },
  markAsRead: async (id: number) => {
    return await api.put(`/v1/notifications/${id}/read`)
  },
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await api.get<UnreadCountResponse>(
      '/v1/notifications/unread-count',
    )
    return res.data
  },
}
