'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Note = {
  id: number
  pageStart?: number
  pageEnd?: number
  description: string
  createdAt: string
}

export default function ExpandableNotes({ notes }: { notes: Note[] }) {
  const [selected, setSelected] = useState<Note | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-hidden">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            layoutId={`note-${note.id}`}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(note)}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between hover:bg-white/10 transition-colors"
          >
            <div>
              {(note.pageStart || note.pageEnd) && (
                <p className="text-xs text-blue-400 mb-2">
                  Page {note.pageStart}
                  {note.pageEnd ? ` - ${note.pageEnd}` : ''}
                </p>
              )}
              <p className="text-sm text-white line-clamp-2 lg:line-clamp-4 whitespace-pre-wrap">
                {note.description}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* POPUP DETAIL */}
      <AnimatePresence>
        {selected && (
          <>
            {/* BACKDROP (Efek Blur) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* CONTAINER PEMBUNGKUS (Menangani Klik Luar) */}
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-default"
              onClick={() => setSelected(null)} // KLIK DI SINI AKAN CLOSE
            >
              <motion.div
                layoutId={`note-${selected.id}`}
                onClick={(e) => e.stopPropagation()} // MENCEGAH CLOSE SAAT KLIK DI DALAM KARTU
                transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B1220] p-6 shadow-2xl overflow-hidden"
              >
                {/* PAGE */}
                {(selected.pageStart || selected.pageEnd) && (
                  <p className="text-sm text-blue-400 mb-3 font-bold uppercase tracking-widest">
                    Page {selected.pageStart}
                    {selected.pageEnd ? ` - ${selected.pageEnd}` : ''}
                  </p>
                )}

                {/* CONTENT */}
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-white whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                    {selected.description}
                  </p>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 font-medium">
                    Created on{' '}
                    {new Date(selected.createdAt).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() => setSelected(null)}
                    className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest transition-colors border border-white/5"
                  >
                    Close Detail
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
