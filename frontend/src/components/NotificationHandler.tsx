'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, InfiniteData } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { AppNotification, NotificationResponse } from '@/types/notifications'
import { getNotificationMessage } from '@/lib/getNotifMessage'

export default function NotificationHandler() {
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Hanya konek jika user sudah login
    if (!isAuthenticated || !user) return

    // GUNAKAN ALAMAT YANG BENAR
    const wsUrl = 'ws://localhost:8080/api/v1/ws'
    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    let isCleaningUp = false

    socket.onopen = () => {
      if (isCleaningUp) return
      console.log('✅ BeBu WebSocket: Connected')
    }

    socket.onmessage = (event) => {
      if (isCleaningUp) return

      try {
        const newNotif = JSON.parse(event.data) as AppNotification
        console.log('📩 New Notif Received:', newNotif)

        // 1. UPDATE CACHE LIST NOTIFIKASI SECARA INSTAN
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

        // 2. INVALIDATE ANGKA UNREAD DI SIDEBAR
        queryClient.invalidateQueries({
          queryKey: ['unread-notification-count'],
        })

        // 3. TAMPILKAN TOAST
        toast.success(newNotif.actorDisplayName, {
          description: getNotificationMessage(newNotif),
          icon: <Bell size={16} className="text-blue-500" />,
        })
      } catch (error) {
        console.error('❌ WS Data Error:', error)
      }
    }

    socket.onclose = (e) => {
      if (isCleaningUp) return
      console.warn('⚠️ WS Disconnected:', e.code)
    }

    socket.onerror = (err) => {
      console.error('❌ WS Socket Error:', err)
    }

    return () => {
      isCleaningUp = true
      socket.close()
    }
  }, [isAuthenticated, user, queryClient])

  return null
}
