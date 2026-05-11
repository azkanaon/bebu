'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Search, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import ClientPortal from '../ClientPortal'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

import { useFollowUser } from '@/api/profile/useFollowUser'
import { useUnfollowUser } from '@/api/profile/useUnfollowUser'
import { FollowUserData } from '@/types/follow'
import {
  useInfiniteFollowers,
  useInfiniteFollowing,
} from '@/hooks/useInfiniteFollow'

type Props = {
  open: boolean
  onClose: () => void
  initialTab?: 'followers' | 'following'
  username: string
}

export default function FollowModal({
  open,
  onClose,
  initialTab = 'followers',
  username,
}: Props) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
    initialTab,
  )
  const [search, setSearch] = useState('')

  // INFINITE HOOKS
  const {
    data: followersData,
    fetchNextPage: fetchFollowers,
    hasNextPage: hasMoreFollowers,
    isFetchingNextPage: isFetchingFollowers,
    isLoading: loadingFollowers,
  } = useInfiniteFollowers(username)

  const {
    data: followingData,
    fetchNextPage: fetchFollowing,
    hasNextPage: hasMoreFollowing,
    isFetchingNextPage: isFetchingFollowing,
    isLoading: loadingFollowing,
  } = useInfiniteFollowing(username)

  // OBSERVER untuk Infinite Scroll
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView) {
      if (activeTab === 'followers' && hasMoreFollowers) fetchFollowers()
      if (activeTab === 'following' && hasMoreFollowing) fetchFollowing()
    }
  }, [
    inView,
    activeTab,
    hasMoreFollowers,
    hasMoreFollowing,
    fetchFollowers,
    fetchFollowing,
  ])

  useEffect(() => {
    if (open) setActiveTab(initialTab)
  }, [open, initialTab])

  // GABUNGKAN PAGES MENJADI SATU ARRAY
  const currentResponse =
    activeTab === 'followers' ? followersData : followingData
  const allUsers = useMemo(() => {
    return currentResponse?.pages.flatMap((page) => page.data) || []
  }, [currentResponse])

  const isLoading =
    activeTab === 'followers' ? loadingFollowers : loadingFollowing
  const isFetchingNext =
    activeTab === 'followers' ? isFetchingFollowers : isFetchingFollowing

  const filteredUsers = useMemo(() => {
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName.toLowerCase().includes(search.toLowerCase()),
    )
  }, [allUsers, search])

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-100 bg-black backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-110 flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
            <motion.div
              initial={{ y: '100dvh', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100dvh', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="pointer-events-auto relative w-full h-[85dvh] md:h-auto md:max-h-[75vh] md:w-105 bg-[#0B1220] rounded-t-3xl md:rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <h2 className="text-sm font-bold text-white tracking-tight uppercase italic">
                  Connections
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 outline-none"
                >
                  <X size={18} />
                </button>
              </div>

              {/* TABS */}
              <div className="flex border-b border-white/5 bg-white/1 shrink-0">
                {(['followers', 'following'] as const).map((tab) => {
                  const isActive = activeTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="relative flex-1 py-3 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span
                        className={isActive ? 'text-white' : 'text-gray-500'}
                      >
                        {tab}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="follow-tab"
                          className="absolute bottom-0 left-6 right-6 h-[1.5px] bg-blue-500 rounded-full"
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* SEARCH */}
              <div className="p-3 border-b border-white/5 shrink-0">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-9 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* USER LIST */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <p className="text-[10px] uppercase tracking-widest font-medium">
                      Loading data...
                    </p>
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredUsers.map((user) => (
                      <UserRow
                        key={user.username}
                        user={user}
                        onCloseModal={onClose}
                        ownerUsername={username}
                        activeTab={activeTab}
                      />
                    ))}

                    {/* SENTINEL / INFINITE SCROLL TRIGGER */}
                    <div ref={ref} className="py-6 flex justify-center">
                      {isFetchingNext ? (
                        <Loader2
                          size={20}
                          className="animate-spin text-blue-500"
                        />
                      ) : (hasMoreFollowers || hasMoreFollowing) &&
                        filteredUsers.length > 0 ? (
                        <div className="h-1 w-1" />
                      ) : filteredUsers.length > 0 ? (
                        <p className="text-[10px] text-gray-600 italic uppercase tracking-widest">
                          End of list
                        </p>
                      ) : null}
                    </div>

                    {filteredUsers.length === 0 && (
                      <div className="py-12 text-center text-xs text-gray-600 italic tracking-wide">
                        No {activeTab} found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MOBILE CLOSE */}
              <div className="p-3 pb-6 md:pb-3 md:hidden border-t border-white/5 shrink-0 bg-[#0B1220]">
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 text-gray-400 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}

function UserRow({
  user,
  onCloseModal,
  ownerUsername,
  activeTab,
}: {
  user: FollowUserData
  onCloseModal: () => void
  ownerUsername: string
  activeTab: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isFollowing, isOwnProfile, isPending } = user.viewerContext
  const { mutate: follow, isPending: fLoading } = useFollowUser()
  const { mutate: unfollow, isPending: uLoading } = useUnfollowUser()

  const handleNavigate = () => {
    onCloseModal()
    router.push(`/${user.username}`)
  }

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFollowing || isPending) {
      unfollow(user.username, {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: [activeTab, ownerUsername],
          }),
      })
    } else {
      follow(user.username, {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: [activeTab, ownerUsername],
          }),
      })
    }
  }

  return (
    <div
      onClick={handleNavigate}
      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/2 transition-all group cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 border border-white/10 rounded-full overflow-hidden bg-white/5">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-bold">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs md:text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
            {user.displayName}
          </p>
          <p className="text-[10px] md:text-xs text-gray-500">
            @{user.username}
          </p>
        </div>
      </div>

      {!isOwnProfile && (
        <button
          disabled={fLoading || uLoading}
          onClick={handleAction}
          className={`px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all min-w-21.25 flex justify-center ${
            isFollowing
              ? 'bg-white/5 text-gray-400 border border-white/5'
              : isPending
                ? 'bg-white/5 text-gray-500 italic'
                : 'bg-blue-600 text-white'
          }`}
        >
          {fLoading || uLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isFollowing ? (
            'Following'
          ) : isPending ? (
            'Requested'
          ) : (
            'Follow'
          )}
        </button>
      )}
    </div>
  )
}
