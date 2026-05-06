'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Note = {
  id: number
  pageStart?: number
  pageEnd?: number
  description: string
  createdAt: string
}

export default function ExpandableMasonryNotes({ notes }: { notes: Note[] }) {
  const [selected, setSelected] = useState<Note | null>(null)

  return (
    <>
      {/* 🔥 MASONRY LAYOUT */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-3">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            layoutId={`note-${note.id}`}
            onClick={() => setSelected(note)}
            whileHover={{ y: -3 }}
            className="
              break-inside-avoid
              cursor-pointer
              rounded-xl
              border border-white/10
              bg-white/5
              p-4
              backdrop-blur-sm
              hover:bg-white/10
              transition-colors
            "
          >
            {/* PAGE */}
            {(note.pageStart || note.pageEnd) && (
              <p className="text-xs text-blue-400 mb-2">
                Page {note.pageStart}
                {note.pageEnd ? ` - ${note.pageEnd}` : ''}
              </p>
            )}

            {/* CONTENT */}
            <p className="text-sm text-white whitespace-pre-wrap line-clamp-6">
              {note.description}
            </p>

            {/* DATE */}
            <p className="text-xs text-gray-400 mt-3">
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* 🔥 SHARED LAYOUT DETAIL */}
      <AnimatePresence>
        {selected && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="
                fixed inset-0 z-40
                bg-black/50
                backdrop-blur-sm
              "
            />

            {/* EXPANDED CARD */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                layoutId={`note-${selected.id}`}
                className="
                  w-full max-w-2xl
                  rounded-2xl
                  border border-white/10
                  bg-[#0B1220]
                  p-6
                  shadow-2xl
                  overflow-y-auto
                  max-h-[85vh]
                "
              >
                {/* PAGE */}
                {(selected.pageStart || selected.pageEnd) && (
                  <p className="text-sm text-blue-400 mb-3">
                    Page {selected.pageStart}
                    {selected.pageEnd ? ` - ${selected.pageEnd}` : ''}
                  </p>
                )}

                {/* CONTENT */}
                <p className="text-white whitespace-pre-wrap leading-7">
                  {selected.description}
                </p>

                {/* DATE */}
                <p className="text-xs text-gray-400 mt-6">
                  {new Date(selected.createdAt).toLocaleDateString()}
                </p>

                {/* CLOSE */}
                <button
                  onClick={() => setSelected(null)}
                  className="
                    mt-6
                    px-4 py-2
                    rounded-lg
                    bg-white/10
                    hover:bg-white/20
                    transition-colors
                  "
                >
                  Close
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
