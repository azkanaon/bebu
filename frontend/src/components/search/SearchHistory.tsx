'use client'

import {
  useClearAllHistory,
  useDeleteHistoryItem,
  useSearchHistory,
} from '@/api/search/useHistory'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, X } from 'lucide-react'

interface Props {
  onSelect: (query: string) => void
}

export default function SearchHistoryList({ onSelect }: Props) {
  const { data: historyData, isLoading } = useSearchHistory()
  const { mutate: deleteItem } = useDeleteHistoryItem()
  const { mutate: clearAll } = useClearAllHistory()

  const history = historyData?.data || []

  if (isLoading) return null
  if (history.length === 0) return null

  return (
    <div className="space-y-4 px-2">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          Recent Searches
        </h3>
        <button
          onClick={() => clearAll()}
          className="text-[10px] font-bold text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-col">
        <AnimatePresence mode="popLayout">
          {history.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group flex items-center justify-between py-3 px-3 hover:bg-white/5 rounded-2xl transition-all cursor-pointer"
              onClick={() => onSelect(item.query)}
            >
              <div className="flex items-center gap-4">
                <Clock
                  size={16}
                  className="text-slate-600 group-hover:text-blue-400 transition-colors"
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  {item.query}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation() // Agar tidak mentrigger onSelect
                  deleteItem(item.id)
                }}
                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full text-slate-500 hover:text-red-400 transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
