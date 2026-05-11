'use client'

import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, Check, User, Loader2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import ClientPortal from '../ClientPortal'
import { useQueryClient, InfiniteData } from '@tanstack/react-query'
import { useAcceptFollowRequest } from '@/api/profile/useAcceptFollowRequest'
import { useDeclineFollowRequest } from '@/api/profile/useDeclineFollowRequest'
import { FollowRequestResponse } from '@/types/follow-request'
import { useFollowRequests } from '@/api/profile/useFollowRequest'
import { useAuthStore } from '@/stores/useAuthStore'

type FollowRequestModalProps = { open: boolean; onClose: () => void }

export default function FollowRequestModal({
  open,
  onClose,
}: FollowRequestModalProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { ref, inView } = useInView()

  // 1. Gunakan Infinite Query
  const {
    data: requestsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useFollowRequests()

  const { mutate: acceptRequest } = useAcceptFollowRequest()
  const { mutate: declineRequest } = useDeclineFollowRequest()

  // 2. Trigger fetch saat scroll ke bawah
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  // 3. Gabungkan semua pages
  const allRequests = useMemo(() => {
    return requestsData?.pages.flatMap((page) => page.data) || []
  }, [requestsData])

  // 4. Logika Update Cache untuk Infinite Data
  const updateCacheAfterAction = (username: string) => {
    queryClient.setQueryData<InfiniteData<FollowRequestResponse>>(
      ['follow-requests'],
      (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.filter((u) => u.username !== username),
            meta: {
              ...page.meta,
              totalItems: Math.max(page.meta.totalItems - 1, 0),
            },
          })),
        }
      },
    )
  }

  const handleAccept = (username: string) => {
    if (!user?.username) return
    acceptRequest(username, {
      onSuccess: () => {
        updateCacheAfterAction(username)
        // Update stats followers di profile sendiri
        queryClient.invalidateQueries({ queryKey: ['profile', user.username] })
      },
    })
  }

  const handleDecline = (username: string) => {
    declineRequest(username, {
      onSuccess: () => updateCacheAfterAction(username),
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md rounded-2xl border border-white/10 bg-[#0B1220] shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-white font-semibold text-lg uppercase italic tracking-tight">
                Follow Requests
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="animate-spin text-blue-500" />
                </div>
              ) : allRequests.length > 0 ? (
                <>
                  {allRequests.map((requestUser) => (
                    <div
                      key={requestUser.username}
                      className="flex items-center justify-between px-5 py-4 border-b border-white/3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/10">
                          <Image
                            src={
                              requestUser.avatarUrl ||
                              'https://i.pravatar.cc/150'
                            }
                            alt={requestUser.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight">
                            {requestUser.username}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">
                            {requestUser.displayName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(requestUser.username)}
                          className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleDecline(requestUser.username)}
                          className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* INFINITE SCROLL TRIGGER */}
                  <div ref={ref} className="py-4 flex justify-center">
                    {isFetchingNextPage && (
                      <Loader2
                        size={18}
                        className="animate-spin text-blue-500"
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-gray-500">
                  <User className="mx-auto mb-2 opacity-20" size={40} />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    No requests yet
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}
