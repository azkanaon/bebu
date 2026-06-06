'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Search, Loader2, UserCircleIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
// 1. IMPORT AUTH STORE
import { useAuthStore } from '@/stores/useAuthStore'

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

  const prevOpenRef = useRef(false)

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setActiveTab(initialTab)
    }

    prevOpenRef.current = open
  }, [open, initialTab])

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
              className="pointer-events-auto relative w-full h-[85dvh] md:h-auto md:max-h-[75vh] md:max-w-xl bg-[#0B1220] rounded-t-3xl md:rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <div className="flex gap-2">
                  <span className="text-white/80">
                    <UserCircleIcon size={20} />
                  </span>
                  <h2 className="text-sm font-bold text-white/80 tracking-tight uppercase">
                    Connections
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 outline-none cursor-pointer"
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
                        <motion.div className="absolute bottom-0 left-6 right-6 h-[1.5px] bg-blue-500 rounded-full" />
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
}: {
  user: FollowUserData
  onCloseModal: () => void
  ownerUsername: string
  activeTab: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // 2. AMBIL USER LOGIN DARI STORE
  const { user: currentUser } = useAuthStore()

  const {
    isFollowing = false,
    isOwnProfile = false,
    isPending = false,
  } = user.viewerContext || {}
  const { mutate: follow, isPending: fLoading } = useFollowUser()
  const { mutate: unfollow, isPending: uLoading } = useUnfollowUser()

  const handleNavigate = () => {
    onCloseModal()
    router.push(`/${user.username}`)
  }

  // 3. PERBAIKAN FUNGSI handleAction
  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Buat satu fungsi penanganan sukses yang lengkap
    const mutationOptions = {
      onSuccess: () => {
        // 1. Invalidate KEDUA list (Followers DAN Following) untuk user yang profilnya sedang dibuka
        // Kita tidak pakai 'activeTab' lagi agar keduanya ter-refresh
        queryClient.invalidateQueries({
          queryKey: ['followers', ownerUsername],
        })
        queryClient.invalidateQueries({
          queryKey: ['following', ownerUsername],
        })

        // 2. Invalidate profile yang sedang dibuka agar angka stats berubah
        queryClient.invalidateQueries({ queryKey: ['profile', ownerUsername] })

        // 3. PENTING: Jika kita mem-follow orang, maka daftar "Following" KITA sendiri juga berubah
        // Kita harus invalidate daftar kita sendiri agar saat kita balik ke profil sendiri, datanya sinkron
        if (currentUser?.username) {
          queryClient.invalidateQueries({
            queryKey: ['followers', currentUser.username],
          })
          queryClient.invalidateQueries({
            queryKey: ['following', currentUser.username],
          })
          queryClient.invalidateQueries({
            queryKey: ['profile', currentUser.username],
          })
        }
      },
    }

    if (isFollowing || isPending) {
      unfollow(user.username, mutationOptions)
    } else {
      follow(user.username, mutationOptions)
    }
  }

  return (
    <div
      onClick={handleNavigate}
      className="flex items-center justify-between px-4 py-4 rounded-xl hover:bg-white/2 transition-all group cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 border border-white/10 rounded-full overflow-hidden bg-white/5">
          <Image
            src={user.avatarUrl ? user.avatarUrl : '/default-avatar.png'}
            alt={user.username}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-xs md:text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
            {user.displayName}
          </p>
          <p className="text-[10px] md:text-sm text-gray-500">
            @{user.username}
          </p>
        </div>
      </div>

      {!isOwnProfile && (
        <button
          disabled={fLoading || uLoading}
          onClick={handleAction}
          className={`px-3.5 py-2 rounded-xl border border-blue-900 text-[10px] md:text-xs tracking-tighter font-bold transition-all min-w-21.25 flex justify-center cursor-pointer ${
            isFollowing
              ? 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
              : isPending
                ? 'bg-white/5 text-gray-500 italic'
                : 'bg-transparent text-white/70 hover:bg-blue-800'
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
