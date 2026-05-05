'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BookCard from './BookCard'
import BookModal from './BookModal'

type Note = {
  id: number
  pageStart?: number
  pageEnd?: number
  description: string
  createdAt: string
}

type BookItem = {
  publicId: string
  book: {
    publicId: string
    title: string
    coverImgUrl: string
    totalPages: number
    authors: string[]
  }
  shelfStatus: 'want_to_read' | 'reading' | 'done'
  progress: number // 0–100
  notes: Note[]
}

// 🔥 DUMMY DATA
const dummy: BookItem[] = [
  {
    publicId: '1',
    book: {
      publicId: 'b1',
      title: 'Atomic Habits',
      coverImgUrl: 'https://picsum.photos/seed/atomic/200/300',
      totalPages: 320,
      authors: ['James Clear'],
    },
    shelfStatus: 'reading',
    progress: 45,
    notes: [
      {
        id: 1,
        pageStart: 50,
        pageEnd: 60,
        description: 'Habit stacking itu powerful banget.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    publicId: '2',
    book: {
      publicId: 'b2',
      title: 'Deep Work',
      coverImgUrl: 'https://picsum.photos/seed/deep/200/300',
      totalPages: 280,
      authors: ['Cal Newport'],
    },
    shelfStatus: 'want_to_read',
    progress: 0,
    notes: [],
  },
  {
    publicId: '3',
    book: {
      publicId: 'b3',
      title: 'The Pragmatic Programmer',
      coverImgUrl: 'https://picsum.photos/seed/pragmatic/200/300',
      totalPages: 350,
      authors: ['Andrew Hunt'],
    },
    shelfStatus: 'done',
    progress: 100,
    notes: [
      {
        id: 2,
        description: 'DRY principle penting banget.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
]

const statusTabs = [
  { key: 'want_to_read', label: 'Want to Read' },
  { key: 'reading', label: 'Reading' },
  { key: 'done', label: 'Done' },
] as const

export default function BookshelfTab() {
  const [active, setActive] =
    useState<(typeof statusTabs)[number]['key']>('reading')
  const [selected, setSelected] = useState<BookItem | null>(null)

  const filtered = dummy.filter((b) => b.shelfStatus === active)

  return (
    <div>
      {/* STATUS TABS */}
      <div className="flex gap-6 border-b border-white/10 mb-4 relative">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="relative pb-2 text-sm"
          >
            <span
              className={active === tab.key ? 'text-white' : 'text-gray-400'}
            >
              {tab.label}
            </span>

            {active === tab.key && (
              <motion.div
                layoutId="books-tab-underline"
                className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-blue-500 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* GRID */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {filtered.map((item) => (
            <BookCard
              key={item.publicId}
              item={item}
              onClick={() => setSelected(item)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* MODAL */}
      <BookModal
        open={!!selected}
        onClose={() => setSelected(null)}
        data={selected}
      />
    </div>
  )
}
