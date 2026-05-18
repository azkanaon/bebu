'use client'

import { useState, useMemo, useEffect, use } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  Bookmark,
  CheckCircle,
  Flame,
  Library,
  Plus,
  Search,
  Loader2,
} from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import {
  useInfiniteBookshelf,
  useReadingStats,
} from '@/api/bookshelf/useBookshelf'
import { useAuthStore } from '@/stores/useAuthStore'
import { BookshelfItem, ShelfStatus } from '@/types/bookshelf'
import BookCard from '@/components/bookshelf/BookCard'
import BookModal from '@/components/bookshelf/BookModal'
import AddBookModal from '@/components/bookshelf/AddBookModal'

type Props = {
  params: Promise<{
    username: string
  }>
}

export default function BookshelfPage({ params }: Props) {
  const { user: currentUser } = useAuthStore()
  const resolvedParams = use(params)
  const profileUsername = resolvedParams.username
  const isMe = currentUser?.username === profileUsername

  const [activeStatus, setActiveStatus] = useState<ShelfStatus>('reading')
  const [searchQuery, setSearchQuery] = useState('')
  const { ref, inView } = useInView()
  const [isAddBookOpen, setIsAddBookOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<BookshelfItem | null>(null)

  // 1. Fetch Data
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteBookshelf(profileUsername, activeStatus)

  const { data: stats } = useReadingStats(profileUsername)

  // 2. Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  // Hook sekarang otomatis fetch ulang saat activeStatus berubah

  // Tidak perlu filter status manual lagi di useMemo
  const filteredBooks = useMemo(() => {
    const allBooks = data?.pages.flatMap((page) => page.data) || []

    // Sekarang useMemo hanya untuk searching teks saja
    return allBooks.filter((item) =>
      item.book.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [data, searchQuery])

  return (
    <div className="flex flex-col gap-8 pb-20 text-slate-200 mt-4">
      {/* HEADER: Reading Stats */}
      <header className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-[#0B1220]/60 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Reading streak</p>
            <p className="text-lg font-semibold text-slate-100">
              {stats?.currentStreak || 0} days
            </p>
          </div>
        </div>

        <div className="bg-[#0B1220]/60 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
            <Library size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Longest streak</p>
            <p className="text-lg font-semibold text-slate-100">
              {stats?.longestStreak || 0} days
            </p>
          </div>
        </div>
      </header>

      <div className="flex sm:hidden overflow-x-auto no-scrollbar gap-2 pb-1">
        <FilterPill
          active={activeStatus === 'reading'}
          onClick={() => setActiveStatus('reading')}
          label="Reading"
        />
        <FilterPill
          active={activeStatus === 'want_to_read'}
          onClick={() => setActiveStatus('want_to_read')}
          label="Wishlist"
        />
        <FilterPill
          active={activeStatus === 'done'}
          onClick={() => setActiveStatus('done')}
          label="Finished"
        />
      </div>

      <div className="flex gap-6 items-start">
        {/* SIDEBAR MINI INTERNAL */}
        <aside className="hidden sm:flex w-36 flex-col gap-1 sticky top-4">
          <NavButton
            active={activeStatus === 'reading'}
            onClick={() => setActiveStatus('reading')}
            icon={<BookOpen size={18} />}
            label="Reading"
          />
          <NavButton
            active={activeStatus === 'want_to_read'}
            onClick={() => setActiveStatus('want_to_read')}
            icon={<Bookmark size={18} />}
            label="Wishlist"
          />
          <NavButton
            active={activeStatus === 'done'}
            onClick={() => setActiveStatus('done')}
            icon={<CheckCircle size={18} />}
            label="Finished"
          />
          {isMe && (
            <button
              onClick={() => setIsAddBookOpen(true)}
              className="mt-4 w-full h-11 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-md active:scale-95 text-sm font-medium cursor-pointer"
            >
              <Plus size={18} />
              <span className="hidden sm:block">Add Book</span>
            </button>
          )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0">
          {/* SEARCH BAR */}
          <div className="mb-6 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in your bookshelf..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-blue-500/30 transition-all"
            />
          </div>

          {/* GRID BUKU */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStatus} // Key di sini sangat penting untuk AnimatePresence
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                >
                  {filteredBooks.map((item) => (
                    <BookCard
                      key={item.publicId}
                      item={item}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* SENTINEL (Trigger Infinite Scroll) */}
          <div ref={ref} className="py-10 flex justify-center">
            {isFetchingNextPage && (
              <Loader2 className="animate-spin text-blue-500" size={20} />
            )}
            {!hasNextPage && !isLoading && filteredBooks.length > 0 && (
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                End of library
              </p>
            )}
            {!isLoading && filteredBooks.length === 0 && (
              <div className="text-center py-20 text-slate-500">
                <p className="text-sm">No books found in this category.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <button
        onClick={() => setIsAddBookOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center sm:hidden z-50 active:scale-90 transition-transform"
      >
        <Plus size={28} />
      </button>
      <BookModal
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        // Kirim ID dan InitialData dari state yang sama
        bookshelfId={selectedItem ? selectedItem.id : null}
        initialData={selectedItem}
        key={selectedItem?.id || 'none'}
        isOwner={isMe}
      />

      <AddBookModal
        open={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        username={profileUsername}
      />
    </div>
  )
}

// Sub-komponen tombol navigasi sidebar internal
interface NavButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center sm:justify-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-sm font-medium outline-none ${
        active
          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent'
      }`}
    >
      {icon}
      <span className="hidden sm:block">{label}</span>
    </button>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'bg-white/5 text-slate-500 border border-white/5'
      }`}
    >
      {label}{' '}
      {count !== undefined && <span className="ml-1 opacity-50">{count}</span>}
    </button>
  )
}
