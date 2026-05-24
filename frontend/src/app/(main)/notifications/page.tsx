'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { BellOff, Loader2 } from 'lucide-react'
import {
  useInfiniteNotifications,
  useMarkAllRead,
} from '@/api/notifications/useNotifications'
import NotifItem from '@/components/notifications/NotifItems'
import { InfiniteData, useQueryClient } from '@tanstack/react-query'
import { AppNotification, NotificationResponse } from '@/types/notifications'

type FilterTab = 'all' | 'follows' | 'interactions'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteNotifications()

  const { mutate: markAllRead } = useMarkAllRead()
  const { ref, inView } = useInView()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  useEffect(() => {
    markAllRead(undefined, {
      onSuccess: () => {
        // 1. Invalidate angka di sidebar
        queryClient.invalidateQueries({
          queryKey: ['unread-notification-count'],
        })

        // 2. Update Cache List Notifikasi (TANPA ANY)
        // Kita beritahu setQueryData bahwa datanya adalah InfiniteData dari NotificationResponse
        queryClient.setQueryData<InfiniteData<NotificationResponse>>(
          ['notifications'],
          (oldData) => {
            if (!oldData) return undefined

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                // Kita map data di dalam setiap page dan ubah isRead jadi true
                data: page.data.map((notif: AppNotification) => ({
                  ...notif,
                  isRead: true,
                })),
              })),
            }
          },
        )
      },
    })
  }, [markAllRead, queryClient])

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  const allNotifications = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data],
  )

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return allNotifications

    if (activeTab === 'follows') {
      return allNotifications.filter((n) =>
        ['FOLLOW_REQUEST', 'FOLLOW_ACCEPT', 'NEW_FOLLOWER'].includes(n.type),
      )
    }

    if (activeTab === 'interactions') {
      return allNotifications.filter(
        (n) => n.type.startsWith('POST_') || n.type.startsWith('COMMENT_'),
      )
    }

    return allNotifications
  }, [allNotifications, activeTab])

  return (
    <div className="max-w-[600px] mx-auto min-h-screen pb-20">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-[#0B1220]/80 backdrop-blur-md border-b border-white/5">
        <div className="px-6 py-5">
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Notifications
          </h1>
        </div>

        {/* TABS FILTER */}
        <div className="flex px-4 pb-2 gap-1">
          <TabButton
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            label="All"
          />
          <TabButton
            active={activeTab === 'follows'}
            onClick={() => setActiveTab('follows')}
            label="Follows"
          />
          <TabButton
            active={activeTab === 'interactions'}
            onClick={() => setActiveTab('interactions')}
            label="Interactions"
          />
        </div>
      </header>
      {/* LIST CONTENT */}
      <main className="divide-y divide-white/5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : filteredNotifications.length > 0 ? ( // 1. Gunakan filteredNotifications di sini
          <>
            <AnimatePresence mode="popLayout">
              {/* 2. Ganti allNotifications menjadi filteredNotifications */}
              {filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <NotifItem notif={notif} />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* INFINITE SCROLL TRIGGER */}
            <div ref={ref} className="py-10 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="animate-spin text-blue-500" size={20} />
              )}
            </div>
          </>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-slate-500">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <BellOff size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-medium">
              No {activeTab} notifications yet
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  )
}
