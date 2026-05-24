import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { notificationService } from '@/services/notification.service'

export const useInfiniteNotifications = () => {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam = 1 }) =>
      notificationService.getNotifications(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
  })
}

export const useMarkAllRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      // Refresh cache agar isRead jadi true semua
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      // Jika kamu punya query untuk 'unread-count', invalidate juga di sini
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] })
    },
  })
}

export const useUnreadNotificationCount = () => {
  return useQuery<number, Error>({
    queryKey: ['unread-notification-count'],
    queryFn: async () => {
      const response = await notificationService.getUnreadCount()
      return response.data.unreadCount
    },
    // Backup: jika WebSocket mati, dia akan fetch ulang setiap 1 menit
    refetchInterval: 60000,
  })
}
