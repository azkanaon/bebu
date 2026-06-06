'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { BellOff, Loader2 } from 'lucide-react'
import {
  useInfiniteNotifications,
  useMarkAllRead,
} from '@/api/notifications/useNotifications'
import NotifItem from '@/components/notifications/NotifItems'
import { useQueryClient } from '@tanstack/react-query'

type FilterTab = 'all' | 'follows' | 'interactions'

export default function NotificationsClient() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const { ref, inView } = useInView()

  // 1. Ambil Data
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteNotifications()

  // 2. Persiapkan Mutasi
  const { mutate: markAllRead } = useMarkAllRead()

  // 3. TRACKER: Gunakan Ref untuk memantau apakah ada notif unread
  const hasUnreadRef = useRef(false)
  const mountTimeRef = useRef<number>(0)
  // Update nilai Ref setiap kali data dari API berubah
  useEffect(() => {
    if (data) {
      const allNotifs = data.pages.flatMap((p) => p.data)
      hasUnreadRef.current = allNotifs.some((n) => !n.isRead)
    }
  }, [data])

  // 4. LOGIKA UTAMA: Mark as Read saat KELUAR halaman
  useEffect(() => {
    mountTimeRef.current = Date.now()
    // Fungsi ini akan berjalan saat user pindah ke halaman lain (Unmount)
    return () => {
      const stayDuration = Date.now() - mountTimeRef.current
      if (hasUnreadRef.current && stayDuration > 1000) {
        console.log(
          '🏃 User leaving notifications page, marking all as read...',
        )

        // Kita panggil mutate tanpa callback onSuccess yang rumit di sini
        // karena komponen sudah unmount. Cukup biarkan API ditembak di background.
        markAllRead(undefined, {
          onSettled: () => {
            // Update cache secara global agar saat user balik lagi, sudah terbaca
            queryClient.invalidateQueries({
              queryKey: ['unread-notification-count'],
            })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
          },
        })
      }
    }
  }, [markAllRead, queryClient])

  // 5. Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  // 6. Filter Logic
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
    <div className="max-w-150 min-h-screen pb-20">
      <header className="sticky top-0 z-10 bg-[#0B1220]/80 backdrop-blur-md border-b border-white/5">
        <div className="px-6 py-5">
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Notifications
          </h1>
        </div>

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

      <main className="divide-y divide-white/5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <>
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <NotifItem notif={notif} />
                </motion.div>
              ))}
            </AnimatePresence>

            <div ref={ref} className="py-10 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="animate-spin text-blue-500" size={20} />
              )}
            </div>
          </>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-slate-500 text-center px-6">
            <BellOff size={32} className="opacity-20 mb-4" />
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
          : 'text-slate-500 hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  )
}
