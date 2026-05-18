'use client'

import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  BookOpen,
  Clock,
  Loader2,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Lightbulb,
  Quote,
} from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import ClientPortal from '../ClientPortal'
import { BookshelfItem, NoteType, ShelfStatus } from '@/types/bookshelf'
import {
  useInfiniteNotes,
  useUpdateBookProgress,
} from '@/api/bookshelf/useBookshelf'
import { useAuthStore } from '@/stores/useAuthStore'

interface ReaderModalProps {
  open: boolean
  onClose: () => void
  item: BookshelfItem | null // Data awal dari grid
}

export default function ReaderModal({ open, onClose, item }: ReaderModalProps) {
  const { user: currentUser } = useAuthStore()
  const isOwner = currentUser?.username !== undefined // Nanti sesuaikan logic cek owner-nya

  // State Filter & Progress
  const [activeNoteType, setActiveNoteType] = useState<NoteType | undefined>(
    undefined,
  )
  const [tempPage, setTempPage] = useState<number>(0)
  const [tempStatus, setTempStatus] = useState<ShelfStatus>('reading')

  // Hook Data
  const {
    data: notesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingNotes,
  } = useInfiniteNotes(item?.id || 0, activeNoteType)

  const { mutate: updateProgress, isPending: isUpdating } =
    useUpdateBookProgress(currentUser?.username || '')

  const { ref, inView } = useInView()

  // Sync state saat modal dibuka
  useEffect(() => {
    if (open && item) {
      setTempPage(item.currentPage)
      setTempStatus(item.shelfStatus)
    }
  }, [open, item])

  // Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  const allNotes = useMemo(() => {
    return notesData?.pages.flatMap((page) => page.data) || []
  }, [notesData])

  if (!item) return null

  const handleSaveProgress = () => {
    updateProgress({
      id: item.id,
      payload: {
        shelf_status: tempStatus,
        current_page: tempPage,
      },
    })
  }

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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />

          {/* MODAL CONTENT */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="pointer-events-auto relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-6xl bg-[#0B1220] md:rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden"
            >
              {/* LEFT SIDE: BOOK INFO (35%) */}
              <div className="w-full md:w-[35%] p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col gap-6 bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="relative aspect-[3/4] w-48 mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <Image
                    src={item.book.coverImgUrl || '/placeholder-book.png'}
                    alt={item.book.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {item.book.title}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {item.book.authors.join(', ')}
                  </p>
                </div>

                <div className="space-y-6 pt-4">
                  {/* Progress Input */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Reading Progress
                      </label>
                      <span className="text-sm font-bold text-blue-400">
                        {Math.round((tempPage / item.book.totalPages) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={tempPage}
                        onChange={(e) =>
                          setTempPage(
                            Math.min(
                              Number(e.target.value),
                              item.book.totalPages,
                            ),
                          )
                        }
                        className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-center outline-none focus:border-blue-500/50"
                      />
                      <span className="text-slate-600 text-sm">
                        of {item.book.totalPages} pages
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Shelf Status
                    </label>
                    <select
                      value={tempStatus}
                      onChange={(e) =>
                        setTempStatus(e.target.value as ShelfStatus)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none appearance-none cursor-pointer"
                    >
                      <option value="want_to_read">Want to Read</option>
                      <option value="reading">Currently Reading</option>
                      <option value="done">Finished</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveProgress}
                    disabled={isUpdating}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Update Progress'}
                  </button>
                </div>
              </div>

              {/* RIGHT SIDE: NOTES (65%) */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#070D18]">
                {/* Header Notes */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Reading Notes
                  </h3>
                  <div className="flex gap-2">
                    <FilterButton
                      active={!activeNoteType}
                      onClick={() => setActiveNoteType(undefined)}
                      label="All"
                    />
                    <FilterButton
                      active={activeNoteType === 'insight'}
                      onClick={() => setActiveNoteType('insight')}
                      icon={<Lightbulb size={12} />}
                    />
                    <FilterButton
                      active={activeNoteType === 'quote'}
                      onClick={() => setActiveNoteType('quote')}
                      icon={<Quote size={12} />}
                    />
                    <FilterButton
                      active={activeNoteType === 'summary'}
                      onClick={() => setActiveNoteType('summary')}
                      icon={<MessageSquare size={12} />}
                    />
                  </div>
                </div>

                {/* List Catatan */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                  <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center gap-3 text-slate-500 hover:text-blue-400 hover:border-blue-500/20 hover:bg-blue-500/5 transition-all group">
                    <Plus
                      size={18}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <span className="text-sm font-medium">
                      Add a new note for this book
                    </span>
                  </button>

                  {loadingNotes ? (
                    <div className="py-20 flex justify-center">
                      <Loader2 className="animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {allNotes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  )}

                  {/* Sentinel */}
                  <div ref={ref} className="py-4 flex justify-center">
                    {isFetchingNextPage && (
                      <Loader2
                        size={16}
                        className="animate-spin text-slate-600"
                      />
                    )}
                  </div>

                  {!loadingNotes && allNotes.length === 0 && (
                    <div className="py-20 text-center text-slate-600 italic text-sm">
                      No notes found for this category.
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/5 bg-[#0B1220] md:hidden">
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-slate-400 font-bold uppercase text-[10px]"
                  >
                    Close Details
                  </button>
                </div>
              </div>

              {/* Close Button Desktop */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors hidden md:block outline-none"
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

// SUB-COMPONENTS
function FilterButton({ active, onClick, label, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white/5 text-slate-500 hover:bg-white/10'
      }`}
    >
      {icon} {label}
    </button>
  )
}

function NoteCard({ note }: { note: any }) {
  const vibe = {
    insight: {
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      icon: <Lightbulb size={12} />,
    },
    quote: {
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      icon: <Quote size={12} />,
    },
    summary: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      icon: <MessageSquare size={12} />,
    },
  }[note.type as NoteType]

  return (
    <div className="bg-white/2 border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-all flex flex-col gap-3 group relative">
      <div className="flex justify-between items-start">
        <div
          className={`px-2 py-0.5 rounded-md ${vibe.bg} ${vibe.color} flex items-center gap-1.5`}
        >
          {vibe.icon}
          <span className="text-[9px] font-black uppercase tracking-wider">
            {note.type}
          </span>
        </div>
        {note.pageStart && (
          <span className="text-[10px] font-mono text-slate-500">
            Pg. {note.pageStart} - {note.pageEnd}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
        {note.description}
      </p>
      <div className="pt-2 flex justify-between items-center">
        <span className="text-[9px] text-slate-600 font-medium uppercase tracking-tight">
          {new Date(note.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
