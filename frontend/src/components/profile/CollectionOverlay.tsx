'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import ClientPortal from '../ClientPortal'

type Item = {
  id: number
  title: string
  description?: string
  icon: string
  points?: number
  category?: string
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  items: Item[]
}

export default function CollectionOverlay({
  open,
  onClose,
  title,
  items,
}: Props) {
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase()),
    )
  }, [items, search])

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm"
          />

          {/* WRAPPER */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="pointer-events-auto relative flex flex-col w-full max-w-4xl max-h-[85vh] rounded-[2rem] border border-white/10 bg-[#071120] shadow-2xl overflow-hidden"
            >
              {/* HEADER */}
              <div className="flex-shrink-0 border-b border-white/10 bg-[#071120]/80 backdrop-blur-xl px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {title}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">
                      {filteredItems.length} items collected
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search items..."
                        className="w-[200px] lg:w-[280px] rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <button
                      onClick={onClose}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all active:scale-95"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                {/* MOBILE SEARCH */}
                <div className="mt-4 md:hidden relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none"
                  />
                </div>
              </div>

              {/* CONTENT AREA (Scrollable Inside) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{
                        y: -5,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                      }}
                      className="group relative flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-all duration-300"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-4xl shadow-inner border border-white/10">
                          {item.icon}
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-4 text-center line-clamp-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-[11px] text-gray-500 text-center mt-1.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {item.points && (
                        <div className="mt-4 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                          <span className="text-[10px] font-bold text-blue-400">
                            +{item.points} PTS
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                {filteredItems.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-gray-500 text-sm italic">
                      No items found matching "{search}"
                    </p>
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
