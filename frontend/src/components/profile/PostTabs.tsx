'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PostCard from './PostCard'
import BookshelfTab from './BookshelfTab'

const tabs = ['Posts', 'Liked', 'Saved', 'Books']

export default function PostTabs() {
  const [active, setActive] = useState('Posts')

  return (
    <div>
      {/* TAB HEADER */}
      <div className="flex gap-6 border-b border-white/10 mb-4 relative">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="relative pb-2 text-sm"
          >
            <span className={active === tab ? 'text-white' : 'text-gray-400'}>
              {tab}
            </span>

            {/* 🔥 UNDERLINE ANIMATION */}
            {active === tab && (
              <motion.div
                layoutId="tab-underline"
                className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-blue-500 rounded-full"
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 🔥 CONTENT ANIMATION */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {active === 'Books' ? <BookshelfTab /> : <PostGrid type="active" />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function PostGrid({ type }: { type: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <PostCard key={i} />
      ))}
    </div>
  )
}

function NotesContent() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#0B1220] border border-white/10 rounded-xl p-4"
        >
          <p className="text-sm text-gray-300">
            Ini adalah contoh note ke-{i + 1}. Kamu bisa isi dengan hasil
            bacaan, insight, atau highlight dari buku.
          </p>
        </div>
      ))}
    </div>
  )
}
