'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import ClientPortal from '../ClientPortal'
import { BookshelfItem } from '@/types/bookshelf'
import BookReaderContent from './BookReaderContent'

interface BookModalProps {
  open: boolean
  onClose: () => void
  bookshelfId: number | null
  initialData: BookshelfItem | null
  isOwner: boolean
}

export default function BookModal({
  open,
  onClose,
  bookshelfId,
  initialData,
  isOwner,
}: BookModalProps) {
  return (
    <AnimatePresence>
      {open && bookshelfId && (
        <ClientPortal>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-100 backdrop-blur-sm hidden md:block"
          />

          {/* WRAPPER */}
          <div className="fixed inset-0 z-110 flex items-center justify-center md:p-6 pointer-events-none">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              className="pointer-events-auto relative w-full h-full md:h-auto md:max-h-[85vh] md:w-[90%] md:max-w-5xl bg-[#0B1220] md:rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* PANGGIL KONTEN UTAMA */}
              <BookReaderContent
                bookshelfId={bookshelfId}
                initialData={initialData}
                isOwner={isOwner}
                onClose={onClose}
              />

              {/* FOOTER CLOSE (Mobile) */}
              <div className="shrink-0 p-5 bg-[#0B1220] border-t border-white/5 md:hidden">
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 py-3 rounded-2xl text-[10px] font-black uppercase text-gray-400"
                >
                  Close Reader Details
                </button>
              </div>

              {/* CLOSE BUTTON (Desktop) */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors hidden md:block cursor-pointer outline-none"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}
