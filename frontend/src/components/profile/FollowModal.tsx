'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ClientPortal from '../ClientPortal'

type User = {
  id: number
  username: string
  name: string
  avatar: string
  isFollowing: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  initialTab?: 'followers' | 'following'
  followers: User[]
  following: User[]
}

export default function FollowModal({
  open,
  onClose,
  initialTab = 'followers',
  followers,
  following,
}: Props) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
    initialTab,
  )
  const [search, setSearch] = useState('')

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const users = useMemo(() => {
    const list = activeTab === 'followers' ? followers : following
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase()),
    )
  }, [activeTab, followers, following, search])

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black backdrop-blur-sm"
          />

          {/* WRAPPER */}
          <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
            {/* MODAL CONTENT */}
            <motion.div
              // MENGGUNAKAN 100dvh AGAR MENEMBUS LAYAR SAAT EXIT
              initial={{ y: '100dvh', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100dvh', opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 28, // Sedikit lebih smooth
                stiffness: 220,
              }}
              className="pointer-events-auto relative w-full h-[85dvh] md:h-auto md:max-h-[75vh] md:w-[420px] bg-[#0B1220] rounded-t-[1.5rem] md:rounded-[1.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Connections
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* TABS */}
              <div className="flex border-b border-white/5 bg-white/[0.01] shrink-0">
                {(['followers', 'following'] as const).map((tab) => {
                  const isActive = activeTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="relative flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors"
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
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-9 py-1.5 text-sm text-white placeholder:text-gray-600 outline-none focus:bg-white/[0.08] transition-all"
                  />
                </div>
              </div>

              {/* USER LIST */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 5 }} // Gunakan x agar transisi antar tab lebih manis
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.15 }}
                    className="p-1"
                  >
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="h-9 w-9 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <p className="text-xs md:text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {user.name}
                            </p>
                            <p className="text-[10px] md:text-xs text-gray-500">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                        <button
                          className={`px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold transition-all active:scale-95 ${
                            user.isFollowing
                              ? 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-500'
                          }`}
                        >
                          {user.isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <div className="py-12 text-center text-xs text-gray-600 italic tracking-wide">
                        No results found
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
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
