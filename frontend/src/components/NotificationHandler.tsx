'use client'

import { useEffect } from 'react'
import { useQueryClient, InfiniteData } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { AppNotification, NotificationResponse } from '@/types/notifications'
import { getNotificationMessage } from '@/lib/getNotifMessage'

export default function NotificationHandler() {
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'
    const socket = new WebSocket(wsUrl)

    socket.onmessage = (event) => {
      try {
        // Beritahu TS bahwa ini adalah AppNotification
        const newNotif = JSON.parse(event.data) as AppNotification

        // 1. UPDATE CACHE
        queryClient.setQueryData<InfiniteData<NotificationResponse>>(
          ['notifications'],
          (oldData) => {
            if (!oldData) return oldData
            const newPages = [...oldData.pages]
            newPages[0] = {
              ...newPages[0],
              data: [newNotif, ...newPages[0].data],
              meta: {
                ...newPages[0].meta,
                totalItems: newPages[0].meta.totalItems + 1,
              },
            }
            return { ...oldData, pages: newPages }
          },
        )

        queryClient.invalidateQueries({
          queryKey: ['unread-notification-count'],
        })

        // 2. TOAST (Gunakan 'action' untuk klik, atau biarkan standar)
        toast.success(`New ${newNotif.type.replace('_', ' ')}`, {
          description: getNotificationMessage(newNotif),
          icon: <Bell size={16} />,
          // Sonner menggunakan action untuk tombol interaktif
          action: {
            label: 'View',
            onClick: () => {
              window.location.href = `/${newNotif.entityType}/${newNotif.entityId}`
            },
          },
        })
      } catch (error) {
        console.error('WS Error:', error)
      }
    }

    return () => socket.close()
  }, [isAuthenticated, user, queryClient])

  return null
}
