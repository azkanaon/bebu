'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PostCard from './PostCard'
import BookshelfShowcase from './BookshelfShowCase'

const tabs = ['Posts', 'Liked', 'Saved', 'Bookshelf']

export default function PostTabs({ username }: { username: string }) {
  const [active, setActive] = useState('Posts')
  const [hovered, setHovered] = useState<string | null>(null) // State untuk mendeteksi hover

  return (
    <div>
      {/* TAB HEADER */}
      <div className="flex gap-2 border-b border-white/10 mb-6 relative px-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            onMouseEnter={() => setHovered(tab)}
            onMouseLeave={() => setHovered(null)}
            className="relative px-4 py-2 text-sm transition-colors duration-300 outline-none cursor-pointer"
          >
            {/* 🔥 HOVER BACKGROUND (Pill Effect) */}
            <AnimatePresence>
              {hovered === tab && (
                <motion.div
                  layoutId="hover-pill"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 bg-white/5 rounded-lg z-0 "
                />
              )}
            </AnimatePresence>

            {/* TEXT */}
            <span
              className={`relative z-10 font-medium ${active === tab ? 'text-white' : 'text-gray-400'}`}
            >
              {tab}
            </span>

            {/* 🔥 UNDERLINE ANIMATION (Active State) */}
            {active === tab && (
              <motion.div
                layoutId="tab-underline"
                className="absolute left-2 right-2 -bottom-px h-0.5 bg-blue-500 rounded-full z-20 "
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* CONTENT ANIMATION */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {active === 'Bookshelf' ? (
            <BookshelfShowcase username={username} />
          ) : (
            <PostGrid type="active" />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function PostGrid({ type }: { type: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <PostCard key={i} />
      ))}
    </div>
  )
}
