'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { Listbox } from '@headlessui/react'
import {
  ChevronsUpDownIcon,
  Plus,
  Lightbulb,
  Quote,
  MessageSquare,
  Save,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'

import ClientPortal from '../ClientPortal'
import { ShelfStatus, NoteType, Note, BookshelfItem } from '@/types/bookshelf'
import {
  useInfiniteNotes,
  useRemoveBook,
  useUpdateBookProgress,
} from '@/api/bookshelf/useBookshelf'
import { useAuthStore } from '@/stores/useAuthStore'
import ExpandableNotes from './ExpandableNotes'
import AddNoteModal from './AddNoteModal'
import ConfirmModal from './ConfirmModal'

const statusOptions: {
  value: ShelfStatus
  label: string
  color: string
  bg: string
}[] = [
  {
    value: 'want_to_read',
    label: 'Want to Read',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    value: 'reading',
    label: 'Reading',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    value: 'done',
    label: 'Done',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
]

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
  const { user } = useAuthStore()
  const [activeFilter, setActiveFilter] = useState<NoteType | undefined>(
    undefined,
  )
  const { ref, inView } = useInView()

  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const { mutate: removeBook, isPending: isRemoving } = useRemoveBook(
    user?.username || '',
  )
  const [showDeleteBookConfirm, setShowDeleteBookConfirm] = useState(false)

  // 1. FETCH DATA NOTES (Infinite)
  const {
    data: notesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteNotes(bookshelfId || 0, activeFilter)

  // 2. MUTATION UNTUK UPDATE PROGRESS
  const { mutate: updateProgress, isPending: isUpdating } =
    useUpdateBookProgress(user?.username || '')

  // Ambil info buku dari data notes (karena API Notes mengembalikan info bookshelf juga)
  const bookshelfInfo = notesData?.pages[0]?.bookshelf
  const totalNotes = notesData?.pages[0]?.meta.totalItems || 0

  // State Lokal untuk Form (Update Progress)
  const [localStatus, setLocalStatus] = useState<ShelfStatus>(
    initialData?.shelfStatus || 'reading',
  )
  const [localPage, setLocalPage] = useState<number>(
    initialData?.currentPage || 0,
  )

  const handleOpenAddNote = () => {
    console.log('Adding new note...')
    setNoteToEdit(null)
    setIsNoteModalOpen(true) // Membuka modal
  }

  const handleOpenEditNote = (note: Note) => {
    console.log('Editing note:', note.id)
    setNoteToEdit(note)
    setIsNoteModalOpen(true) // Membuka modal
  }

  useEffect(() => {
    if (open) {
      if (initialData) {
        setLocalStatus(initialData.shelfStatus)
        setLocalPage(initialData.currentPage)
      } else if (bookshelfInfo) {
        // Fallback jika initialData tidak ada tapi info dari API notes ada
        setLocalPage(bookshelfInfo.currentPage)
        // Jika di API notes ada shelfStatus, masukkan juga:
        // setLocalStatus(bookshelfInfo.shelfStatus)
      }
    }
  }, [open, initialData, bookshelfInfo])

  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current && bookshelfInfo) {
      setLocalPage(bookshelfInfo.currentPage)
      setLocalStatus('reading')
      setActiveFilter(undefined)
    }

    prevOpenRef.current = open
  }, [open, bookshelfInfo])

  // Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  // Gabungkan semua catatan dari berbagai halaman
  const allNotes = useMemo(() => {
    return notesData?.pages.flatMap((page) => page.data) || []
  }, [notesData])

  if (!bookshelfId) return null

  const handleSaveProgress = () => {
    updateProgress({
      id: bookshelfId,
      payload: {
        shelf_status: localStatus,
        current_page: localPage,
      },
    })
  }

  const handleRemoveBook = () => {
    removeBook(bookshelfId!, {
      onSuccess: () => {
        setShowDeleteBookConfirm(false)
        onClose()
      },
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-100 backdrop-blur-sm hidden md:block"
          />

          <div className="fixed inset-0 z-110 flex items-center justify-center md:p-6 pointer-events-none">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="pointer-events-auto relative w-full h-full md:h-auto md:max-h-[85vh] md:w-[90%] md:max-w-5xl bg-[#0B1220] md:rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* --- KOLOM KIRI: INFO & PROGRESS --- */}
                <div className="shrink-0 w-full md:w-[320px] lg:w-90 p-6 bg-white/2 border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar">
                  {isLoading && !bookshelfInfo ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-500" />
                    </div>
                  ) : (
                    bookshelfInfo && (
                      <div className="space-y-6">
                        <div className="flex gap-4 md:flex-col items-start">
                          <div className="w-24 h-36 md:w-40 md:h-56 mx-auto relative shrink-0 shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                            <Image
                              src={bookshelfInfo.coverImgUrl}
                              className="object-cover blur-lg opacity-50"
                              alt=""
                              fill
                              priority
                            />
                            <Image
                              src={bookshelfInfo.coverImgUrl}
                              className="object-contain relative z-10"
                              alt={bookshelfInfo.title}
                              fill
                            />
                          </div>
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="text-white font-bold text-lg md:text-xl leading-tight line-clamp-2">
                              {bookshelfInfo.title}
                            </h3>
                            <p className="text-[11px] md:text-sm text-gray-500 mt-1">
                              {bookshelfInfo.authors.join(', ')}
                            </p>
                            <p className="text-[11px] md:text-sm text-gray-500 mt-1">
                              {bookshelfInfo.totalPages} pages
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 space-y-6">
                          {/* INPUT PROGRESS */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-end">
                              <label className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black">
                                Current Progress
                              </label>
                              <span className="text-sm font-bold text-blue-400">
                                {bookshelfInfo.progress}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  value={localPage}
                                  onChange={(e) =>
                                    setLocalPage(Number(e.target.value))
                                  }
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                  disabled={!isOwner || isUpdating}
                                />
                              </div>
                              {isOwner && (
                                <button
                                  onClick={handleSaveProgress}
                                  disabled={isUpdating}
                                  className="p-2.5 bg-blue-600 rounded-xl text-white hover:bg-blue-500 disabled:opacity-30 transition-all cursor-pointer"
                                >
                                  <Save size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                          {isOwner && (
                            <button
                              onClick={() => setShowDeleteBookConfirm(true)}
                              disabled={isRemoving}
                              className="w-full mt-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {isRemoving ? 'Removing...' : 'Remove from Shelf'}
                            </button>
                          )}

                          {/* STATUS SELECTOR */}
                          <div className="space-y-3">
                            <label className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black">
                              Shelf Status
                            </label>
                            <StatusSelect
                              status={localStatus}
                              setStatus={setLocalStatus}
                              isOwner={isOwner}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* --- KOLOM KANAN: NOTES AREA --- */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#070D18]/40">
                  {/* Header Notes & Filter */}
                  <div className="p-6 md:p-8 pb-4 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black">
                          Reading Notes
                        </h4>

                        <span className="text-[9px] text-blue-400 font-black bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          {totalNotes} NOTES
                        </span>
                      </div>
                      {isOwner && (
                        <button
                          onClick={handleOpenAddNote}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all cursor-pointer group active:scale-95"
                        >
                          <Plus size={14} className="text-white" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            Add Note
                          </span>
                        </button>
                      )}
                    </div>

                    {/* FILTER TABS (API-Linked) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                      <FilterTab
                        active={!activeFilter}
                        onClick={() => setActiveFilter(undefined)}
                        label="All Notes"
                      />
                      <FilterTab
                        active={activeFilter === 'insight'}
                        onClick={() => setActiveFilter('insight')}
                        label="Insights"
                        icon={<Lightbulb size={12} />}
                      />
                      <FilterTab
                        active={activeFilter === 'quote'}
                        onClick={() => setActiveFilter('quote')}
                        label="Quotes"
                        icon={<Quote size={12} />}
                      />
                      <FilterTab
                        active={activeFilter === 'summary'}
                        onClick={() => setActiveFilter('summary')}
                        label="Summaries"
                        icon={<MessageSquare size={12} />}
                      />
                    </div>
                  </div>

                  {/* LIST CATATAN DENGAN INFINITE SCROLL */}
                  <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-10 custom-scrollbar">
                    {isLoading && !isFetchingNextPage ? (
                      <div className="h-40 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-500" />
                      </div>
                    ) : allNotes.length === 0 ? (
                      <div className="py-20 text-center border border-dashed border-white/5 rounded-4xl opacity-30">
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                          No {activeFilter} notes yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ExpandableNotes
                          notes={allNotes}
                          bookshelfId={bookshelfId}
                          isOwner={isOwner}
                          onEdit={handleOpenEditNote}
                        />

                        {/* SENTINEL UNTUK INFINITE SCROLL */}
                        <div ref={ref} className="py-4 flex justify-center">
                          {isFetchingNextPage && (
                            <Loader2
                              size={18}
                              className="animate-spin text-blue-500"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="shrink-0 p-5 bg-[#0B1220] border-t border-white/5">
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 hover:bg-white/10 text-gray-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer"
                >
                  Close Reader Details
                </button>
              </div>
            </motion.div>
          </div>
          {bookshelfId && (
            <AddNoteModal
              open={isNoteModalOpen}
              onClose={() => setIsNoteModalOpen(false)}
              bookshelfId={bookshelfId}
              editData={noteToEdit}
            />
          )}
          <ConfirmModal
            open={showDeleteBookConfirm}
            onClose={() => setShowDeleteBookConfirm(false)}
            onConfirm={handleRemoveBook}
            title="Remove Book?"
            message="Are you sure you want to remove this book and all its notes from your library? This action cannot be undone."
            confirmText="Remove Now"
            isDestructive={true}
            isPending={isRemoving}
          />
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}

// --- SUB-COMPONENTS (Strictly Typed) ---

function FilterTab({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer border ${active ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-transparent text-gray-500 hover:text-gray-300'}`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
    </button>
  )
}

function StatusSelect({
  status,
  setStatus,
  isOwner,
}: {
  status: ShelfStatus
  setStatus: (s: ShelfStatus) => void
  isOwner: boolean
}) {
  const selected =
    statusOptions.find((o) => o.value === status) || statusOptions[0]
  return (
    <Listbox value={status} onChange={setStatus} disabled={!isOwner}>
      <div className="relative">
        <Listbox.Button
          className={`relative w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-left text-[10px] font-black transition-all ${selected.color}`}
        >
          <span className="block truncate uppercase tracking-widest">
            {selected.label}
          </span>
          <ChevronsUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-130 bottom-full mb-2 w-full rounded-xl border border-white/10 bg-[#161B26] p-1 shadow-2xl outline-none">
          {statusOptions.map((option) => (
            <Listbox.Option
              key={option.value}
              value={option.value}
              className={({ active }) =>
                `cursor-pointer rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${option.color} ${active ? 'bg-white/5' : 'opacity-40'}`
              }
            >
              {option.label}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  )
}
