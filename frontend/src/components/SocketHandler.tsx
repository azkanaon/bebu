'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, InfiniteData } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { toast } from 'sonner'
import { Bell, MessageCircle } from 'lucide-react'
import { AppNotification, NotificationResponse } from '@/types/notifications'
import { ChatMessage, MessagesResponse, InboxResponse } from '@/types/chat'
import Cookies from 'js-cookie' // Pastikan sudah install js-cookie
import { getNotificationMessage } from '@/lib/getNotifMessage'

export default function SocketHandler() {
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // 1. AMBIL TOKEN DARI COOKIE (Sesuaikan dengan nama cookie auth kamu)
    const token = Cookies.get('token')
    const wsUrl = `ws://localhost:8080/api/v1/ws?token=${token}`
    console.log(token)

    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    let isCleaningUp = false

    socket.onopen = () => {
      if (isCleaningUp) return
      console.log('✅ BeBu Real-time: Connected')
    }

    socket.onmessage = (event) => {
      if (isCleaningUp) return

      try {
        const data = JSON.parse(event.data)
        console.log(data.event)

        switch (data.event) {
          case 'NEW_NOTIFICATION':
            console.log('🔔 Social Notification received')
            handleNotification(data.payload as AppNotification)
            break

          case 'NEW_MESSAGE':
            console.log('💬 Chat Message received')
            handleNewMessage(data.payload as ChatMessage)
            break

          default:
            console.warn('❓ Unknown event received:', data.event)
        }
      } catch (error) {
        console.error('❌ Socket Error:', error)
      }
    }

    // --- LOGIKA UPDATE CACHE CHAT ---
    const handleNewMessage = (newMessage: ChatMessage) => {
      console.log('📩 New Message via WS:', newMessage)

      // 1. UPDATE CACHE PESAN (Chat Room)
      // Kita tambahkan pesan baru ke halaman paling awal di cache chat-messages
      queryClient.setQueryData<InfiniteData<MessagesResponse>>(
        ['chat-messages', newMessage.conversationId],
        (oldData) => {
          if (!oldData) return oldData
          const newPages = [...oldData.pages]
          // Tambahkan di awal array data pada page 0
          newPages[0] = {
            ...newPages[0],
            data: [newMessage, ...newPages[0].data],
          }
          return { ...oldData, pages: newPages }
        },
      )

      // 2. UPDATE CACHE INBOX (Daftar Chat di Kiri)
      // Kita geser obrolan ini ke urutan paling atas dan update pesan terakhirnya
      queryClient.setQueryData<InfiniteData<InboxResponse>>(
        ['chat-inbox'],
        (oldData) => {
          if (!oldData) return oldData

          // Cari obrolan yang bersangkutan, update, lalu taruh paling depan
          const allConversations = oldData.pages.flatMap((p) => p.data)
          const targetConv = allConversations.find(
            (c) => c.id === newMessage.conversationId,
          )

          if (targetConv) {
            const updatedConv = {
              ...targetConv,
              lastMessage: newMessage.body,
              updatedAt: newMessage.createdAt,
              unreadCount: targetConv.unreadCount + 1, // Tambah angka unread
            }

            // Susun ulang pages agar yang terupdate ada di paling atas
            const filtered = allConversations.filter(
              (c) => c.id !== newMessage.conversationId,
            )
            const finalData = [updatedConv, ...filtered]

            return {
              ...oldData,
              pages: [{ ...oldData.pages[0], data: finalData }], // Sederhanakan ke page 1 untuk instan refresh
            }
          }
          return oldData
        },
      )

      // 3. TAMPILKAN TOAST (Jika user tidak sedang di room chat tersebut)
      // Cek apakah URL sekarang mengandung ID conversation ini
      const currentPath = window.location.pathname
      if (!currentPath.includes(`/chat/${newMessage.conversationId}`)) {
        toast(newMessage.senderDisplayName, {
          description: newMessage.body,
          icon: <MessageCircle size={16} className="text-blue-500" />,
        })
      }
    }

    const handleNotification = (newNotif: AppNotification) => {
      console.log('🔔 New Notification via WS:', newNotif)

      // 1. UPDATE CACHE LIST NOTIFIKASI
      // Memasukkan notifikasi baru ke urutan paling atas di halaman pertama
      queryClient.setQueryData<InfiniteData<NotificationResponse>>(
        ['notifications'],
        (oldData) => {
          if (!oldData) return oldData

          const newPages = [...oldData.pages]

          // Update halaman pertama (index 0)
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

      // 2. UPDATE ANGKA UNREAD DI SIDEBAR
      // Kita invalidate agar Sidebar memanggil API getUnreadCount terbaru
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] })

      // 3. TAMPILKAN TOAST (Visual Feedback)
      toast.success(newNotif.actorDisplayName || 'New Activity', {
        description: getNotificationMessage(newNotif),
        icon: <Bell size={16} className="text-blue-500" />,
      })
    }

    socket.onclose = () => {
      console.warn('⚠️ Socket Disconnected')
    }

    return () => {
      isCleaningUp = true
      socket.close()
    }
  }, [isAuthenticated, user, queryClient])

  return null
}
