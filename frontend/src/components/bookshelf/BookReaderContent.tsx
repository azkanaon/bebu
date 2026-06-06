'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Trash2,
} from 'lucide-react'

import BookCover from '@/components/BookCover'
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

interface BookReaderContentProps {
  bookshelfId: number
  initialData: BookshelfItem | null
  isOwner: boolean
  onClose?: () => void
  variant?: 'modal' | 'page'
}

export default function BookReaderContent({
  bookshelfId,
  initialData,
  isOwner,
  onClose,
  variant = 'modal',
}: BookReaderContentProps) {
  const { user } = useAuthStore()
  const [activeFilter, setActiveFilter] = useState<NoteType | undefined>(
    undefined,
  )
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [showDeleteBookConfirm, setShowDeleteBookConfirm] = useState(false)
  const { ref, inView } = useInView()

  const {
    data: notesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteNotes(bookshelfId, activeFilter)

  const { mutate: updateProgress, isPending: isUpdating } =
    useUpdateBookProgress(user?.username || '')

  const { mutate: removeBook, isPending: isRemoving } = useRemoveBook(
    user?.username || '',
  )

  const bookshelfInfo = notesData?.pages[0]?.bookshelf
  const totalNotes = notesData?.pages[0]?.meta.totalItems || 0

  const [localStatus, setLocalStatus] = useState<ShelfStatus>(
    initialData?.shelfStatus || 'reading',
  )
  const [localPage, setLocalPage] = useState<number>(
    initialData?.currentPage || 0,
  )

  const handleOpenAddNote = () => {
    setNoteToEdit(null)
    setIsNoteModalOpen(true)
  }

  const handleOpenEditNote = (note: Note) => {
    setNoteToEdit(note)
    setIsNoteModalOpen(true)
  }

  useEffect(() => {
    // Jika ada data dari props (navigasi internal/modal)
    if (initialData) {
      setLocalStatus(initialData.shelfStatus)
      setLocalPage(initialData.currentPage)
    }
    // Jika initialData null (Refresh halaman/Full Page), ambil dari hasil hit API Notes
    else if (bookshelfInfo) {
      setLocalPage(bookshelfInfo.currentPage)

      // PERBAIKAN DI SINI: Pastikan status juga diupdate!
      // Asumsikan API Notes kamu mengembalikan shelfStatus di dalam objek bookshelf
      if (bookshelfInfo.shelfStatus) {
        setLocalStatus(bookshelfInfo.shelfStatus as ShelfStatus)
      }
    }
  }, [initialData, bookshelfInfo])

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  const allNotes = useMemo(
    () => notesData?.pages.flatMap((page) => page.data) || [],
    [notesData],
  )

  const handleSaveProgress = () => {
    updateProgress({
      id: bookshelfId,
      payload: { shelf_status: localStatus, current_page: localPage },
    })
  }

  const handleRemoveBook = () => {
    removeBook(bookshelfId, {
      onSuccess: () => {
        setShowDeleteBookConfirm(false)
        if (onClose) onClose()
      },
    })
  }

  const containerClass =
    variant === 'modal'
      ? 'flex-1 flex flex-col md:flex-row overflow-hidden'
      : 'flex flex-col w-full'

  const sidebarClass =
    variant === 'modal'
      ? 'shrink-0 w-full md:w-[320px] lg:w-90 p-6 bg-white/2 border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar'
      : 'w-full p-8 bg-white/2 border-b border-white/5'

  const contentClass =
    variant === 'modal'
      ? 'flex-1 flex flex-col min-h-0 bg-[#070D18]/40'
      : 'w-full flex flex-col bg-[#070D18]/20'

  return (
    <div className={containerClass}>
      {/* --- KOLOM KIRI: INFO & PROGRESS --- */}
      <div className={sidebarClass}>
        {isLoading && !bookshelfInfo ? (
          <div className="h-full flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : (
          bookshelfInfo && (
            /* 
         MENGGUNAKAN GRID: 
         Baris 1: Info Buku & Cover
         Baris 2: Controls (Progress & Status)
      */
            <div
              className={
                variant === 'page' ? 'flex flex-col gap-6' : 'space-y-6'
              }
            >
              {/* --- BARIS 1: INFO BUKU --- */}
              <div className="flex gap-4 items-start">
                <div
                  className={`${variant === 'page' ? 'w-24 h-32' : 'w-24 h-36 md:w-40 md:h-56'} relative shrink-0 shadow-xl rounded-xl overflow-hidden border border-white/10 bg-black/20`}
                >
                  <BookCover
                    src={bookshelfInfo.coverImgUrl}
                    title=""
                    fill
                    className="blur-lg opacity-50 object-cover"
                  />
                  <BookCover
                    src={bookshelfInfo.coverImgUrl}
                    title={bookshelfInfo.title}
                    fill
                    className="object-contain relative z-10"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white leading-tight truncate">
                    {bookshelfInfo.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 truncate">
                    {bookshelfInfo.authors.join(', ')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">
                    {bookshelfInfo.totalPages} PAGES
                  </p>
                </div>
              </div>

              {/* --- BARIS 2: CONTROLS (Dibuat Grid agar Sejajar Rapi) --- */}
              <div
                className={
                  variant === 'page'
                    ? 'grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white/3 rounded-2xl border border-white/5 '
                    : 'pt-4 space-y-6'
                }
              >
                {/* Progress Input */}
                <div className="space-y-2 flex flex-col justify-between ">
                  <div className="flex justify-between items-center ">
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                      Progress
                    </label>
                    <span className="text-[10px] font-bold text-blue-400">
                      {bookshelfInfo.progress}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={localPage}
                      onChange={(e) => setLocalPage(Number(e.target.value))}
                      className="w-full bg-[#0B1220] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50"
                      disabled={!isOwner || isUpdating}
                    />
                    {isOwner && (
                      <button
                        onClick={handleSaveProgress}
                        disabled={isUpdating}
                        className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-all cursor-pointer"
                      >
                        <Save size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Select */}
                <div className="space-y-2 flex flex-col justify-between">
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                    Status
                  </label>
                  <StatusSelect
                    status={localStatus}
                    setStatus={setLocalStatus}
                    isOwner={isOwner}
                  />
                </div>

                {/* Remove Button */}
                {isOwner && (
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={() => setShowDeleteBookConfirm(true)}
                      disabled={isRemoving}
                      className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Trash2 size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        Remove
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* --- KOLOM KANAN: NOTES AREA --- */}
      <div className={contentClass}>
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
              <div ref={ref} className="py-4 flex justify-center">
                {isFetchingNextPage && (
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL-MODAL TERKAIT */}
      {isNoteModalOpen && (
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
        message="This action cannot be undone."
        confirmText="Remove Now"
        isDestructive={true}
        isPending={isRemoving}
      />
    </div>
  )
}

// Sub-komponen (Sama seperti sebelumnya)
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
      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${active ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-transparent text-gray-500'}`}
    >
      {icon}{' '}
      <span className="text-[9px] font-black uppercase tracking-widest">
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
                `cursor-pointer rounded-lg px-3 py-2 text-[9px] font-black uppercase transition-all ${option.color} ${active ? 'bg-white/5' : 'opacity-40'}`
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
