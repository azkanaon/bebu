'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Search, Loader2, Trophy, Star } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import ClientPortal from '../ClientPortal'
import Image from 'next/image'
import { useInfiniteAchievements } from '@/api/profile/useInfiniteCollection'
import { toast } from 'sonner'
import { useUpdateFavoriteAchievements } from '@/api/profile/useUpdateFavorites'
import { useAuthStore } from '@/stores/useAuthStore'

type Props = {
  open: boolean
  onClose: () => void
  username: string
  initialFavorites?: [] | null
}
const getAchievementVibe = (name: string) => {
  const vibes = [
    {
      color: 'blue',
      gradient: 'from-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'bg-blue-500/10',
    },
    {
      color: 'purple',
      gradient: 'from-purple-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'bg-purple-500/10',
    },
    {
      color: 'amber',
      gradient: 'from-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'bg-amber-500/10',
    },
    {
      color: 'emerald',
      gradient: 'from-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'bg-emerald-500/10',
    },
    {
      color: 'rose',
      gradient: 'from-rose-500/20',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      glow: 'bg-rose-500/10',
    },
  ]
  // Ambil index berdasarkan panjang nama agar warnanya selalu sama untuk item yang sama
  const index = name.length % vibes.length
  return vibes[index]
}
export default function AchievementsOverlay({
  open,
  onClose,
  username,
  initialFavorites,
}: Props) {
  const [search, setSearch] = useState('')
  const { ref, inView } = useInView()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteAchievements(username)

  const { user: currentUser } = useAuthStore()
  const isOwnProfile = currentUser?.username === username

  const { mutate: updateFavs } = useUpdateFavoriteAchievements(username)

  // Gunakan state lokal agar UI bintang langsung berubah (instan)
  // Kita ambil ID saja dari initialFavorites (data yang ada di ProfileHeader)
  const [favIds, setFavIds] = useState<number[]>([])

  useEffect(() => {
    if (open) {
      setFavIds(initialFavorites?.map((f: any) => f.achievementId))
    }
  }, [open, initialFavorites])

  const handleToggleFavorite = (badgeId: number) => {
    let newFavIds = [...favIds]

    if (newFavIds.includes(badgeId)) {
      // UNSTAR: Hapus dari daftar
      newFavIds = newFavIds.filter((id) => id !== badgeId)
    } else {
      // STAR: Cek jika sudah 4
      if (newFavIds.length >= 4) {
        return toast.error('Maximum 4 favorite badges allowed!')
      }
      newFavIds.push(badgeId)
    }

    // Update state lokal (biar bintang langsung nyala/mati)
    setFavIds(newFavIds)

    // Kirim ke Backend dengan format [{itemId, order}]
    const payload = newFavIds.map((id, index) => ({
      itemId: id,
      order: index + 1,
    }))
    updateFavs(payload)
  }

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  const allItems = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || []
  }, [data])

  const filteredItems = useMemo(() => {
    return allItems.filter((item) =>
      item.achievementName.toLowerCase().includes(search.toLowerCase()),
    )
  }, [allItems, search])

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-90 bg-black/80 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto relative flex flex-col w-full max-w-4xl h-[85vh] rounded-4xl border border-white/10 bg-[#071120] shadow-2xl overflow-hidden text-white"
            >
              {/* HEADER */}
              <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2 italic uppercase tracking-tighter">
                    <Trophy className="text-blue-500" /> Achievements
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                    {data?.pages[0]?.meta.totalItems || 0} Unlocked
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 md:w-64">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search achievement..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {filteredItems.map((item, i) => {
                      const vibe = getAchievementVibe(item.achievementName)
                      const isStarred = favIds.includes(item.achievementId)
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          whileHover={{ y: -8 }}
                          className={`group relative flex flex-col items-center rounded-4xl border ${vibe.border} bg-white/2 p-6 transition-all duration-500 overflow-hidden shadow-2xl`}
                        >
                          {isOwnProfile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleFavorite(item.badgeId)
                              }}
                              className={`absolute top-4 right-4 z-20 p-1.5 rounded-full transition-all duration-300 outline-none ${
                                isStarred
                                  ? `${vibe.text} bg-white/10 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.1)]`
                                  : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-gray-400'
                              }`}
                            >
                              <Star
                                size={16}
                                fill={isStarred ? 'currentColor' : 'none'}
                                className={isStarred ? 'animate-pulse' : ''}
                              />
                            </button>
                          )}
                          {/* BACKGROUND GLOW EFFECT */}
                          <div
                            className={`absolute -top-10 -right-10 w-32 h-32 ${vibe.glow} blur-2xl rounded-full group-hover:opacity-100 opacity-50 transition-opacity`}
                          />

                          {/* ICON CONTAINER */}
                          <div className="relative mb-5">
                            {/* Animated Ring behind the icon */}
                            <div
                              className={`absolute inset-0 rounded-full ${vibe.glow} blur-xl group-hover:scale-150 transition-transform duration-700`}
                            />

                            <div
                              className={`relative w-20 h-20 rounded-2xl bg-linear-to-br ${vibe.gradient} to-transparent flex items-center justify-center p-3 border border-white/10 shadow-inner group-hover:rotate-6 transition-transform duration-500`}
                            >
                              <Image
                                src={item.logoUrl}
                                alt={item.achievementName}
                                fill
                                className="object-contain p-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                              />
                            </div>
                          </div>

                          {/* TEXT CONTENT */}
                          <div className="text-center relative z-10">
                            <h3
                              className={`text-[12px] font-black uppercase tracking-tighter leading-tight ${vibe.text}`}
                            >
                              {item.achievementName}
                            </h3>

                            <p className="text-[9px] text-gray-500 mt-2 line-clamp-2 leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                              {item.description}
                            </p>
                          </div>

                          {/* DATE FOOTER */}
                          {item.earnedAt && (
                            <div className="mt-5 w-full pt-4 border-t border-white/5">
                              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 group-hover:text-gray-400 transition-colors">
                                Unlocked{' '}
                                {new Date(item.earnedAt).toLocaleDateString(
                                  'en-US',
                                  { month: 'short', year: 'numeric' },
                                )}
                              </p>
                            </div>
                          )}

                          {/* DECORATIVE LIGHT STREAK */}
                          <div className="absolute top-0 -left-full w-full h-full bg-linear-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] group-hover:left-full transition-all duration-1000" />
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {/* SENTINEL */}
                <div ref={ref} className="py-10 flex justify-center">
                  {isFetchingNextPage && (
                    <Loader2 className="animate-spin text-blue-500" size={20} />
                  )}
                  {!hasNextPage && !isLoading && filteredItems.length > 0 && (
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                      Mastered All Achievements
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}
