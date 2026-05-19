'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, BookPlus, Database, Globe } from 'lucide-react'
import { externalService } from '@/services/external.service'
import { bookshelfService } from '@/services/bookshelf.service'
import { GoogleBookVolume } from '@/types/google-books'
import { AddBookRequest, LocalBook, ShelfStatus } from '@/types/bookshelf'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import ClientPortal from '../ClientPortal'

interface AddBookModalProps {
  open: boolean
  onClose: () => void
  username: string
}

export default function AddBookModal({
  open,
  onClose,
  username,
}: AddBookModalProps) {
  const queryClient = useQueryClient()

  // --- STATE ---
  const [query, setQuery] = useState<string>('')
  const [searching, setSearching] = useState<boolean>(false)
  const [localResults, setLocalResults] = useState<LocalBook[]>([])
  const [googleResults, setGoogleResults] = useState<GoogleBookVolume[]>([])

  const [selectedLocal, setSelectedLocal] = useState<LocalBook | null>(null)
  const [selectedGoogle, setSelectedGoogle] = useState<GoogleBookVolume | null>(
    null,
  )
  const [status, setStatus] = useState<ShelfStatus>('want_to_read')

  // --- LOGIKA PENCARIAN (Debounced) ---
  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery.length < 2) {
      setLocalResults([])
      setGoogleResults([])
      return
    }

    setSearching(true)
    try {
      // 1. Cari di Database BeBu Lokal (Berdasarkan Judul)
      const localData = await bookshelfService.searchLocalBooks(trimmedQuery)
      setLocalResults(localData.books || [])

      // 2. Jika di Lokal tidak ada hasil sama sekali, panggil Google Books API
      if (!localData.books || localData.books.length === 0) {
        const googleData = await externalService.searchGoogleBooks(trimmedQuery)
        setGoogleResults(googleData.items || [])
      } else {
        setGoogleResults([]) // Reset hasil google jika sudah ada di lokal
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) performSearch(query)
    }, 600) // Delay 600ms untuk debounce
    return () => clearTimeout(timer)
  }, [query, performSearch])

  // --- LOGIKA SIMPAN ---
  const { mutate: addToShelf, isPending } = useMutation({
    mutationFn: (payload: AddBookRequest) =>
      bookshelfService.addBookToShelf(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookshelf', username] })
      toast.success('Book successfully added to your shelf!')
      handleClose()
    },
  })

  const handleSave = () => {
    if (selectedLocal) {
      addToShelf({
        google_book_id: selectedLocal.google_books_id, // Kita tetap kirim Google ID sebagai kunci unik
        title: selectedLocal.title,
        authors: selectedLocal.authors,
        genres: selectedLocal.genres,
        synopsis: selectedLocal.synopsis,
        cover_img_url: selectedLocal.cover_img_url,
        total_pages: selectedLocal.total_pages,
        publication_year: selectedLocal.publication_year,
        language: selectedLocal.language,
        shelf_status: status, // Status dari state modal
      })
    } else if (selectedGoogle) {
      // Jika pilih buku baru dari Google
      const info = selectedGoogle.volumeInfo
      addToShelf({
        google_book_id: selectedGoogle.id,
        title: info.title,
        authors: info.authors || ['Unknown Author'],
        genres: info.categories || ['General'],
        synopsis: info.description || '',
        cover_img_url:
          info.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
        total_pages: info.pageCount || 0,
        publication_year: info.publishedDate
          ? parseInt(info.publishedDate.substring(0, 4))
          : 0,
        language: info.language || 'en',
        shelf_status: status,
      })
    }
  }

  const handleClose = () => {
    setQuery('')
    setLocalResults([])
    setGoogleResults([])
    setSelectedLocal(null)
    setSelectedGoogle(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-150 bg-black/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-160 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pointer-events-auto w-full max-w-lg bg-[#0B1220] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* HEADER */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/1">
                <h2 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <BookPlus size={16} className="text-blue-500" /> Add to
                  Bookshelf
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-white transition-colors cursor-pointer outline-none"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* SEARCH INPUT */}
                <div className="relative group">
                  <Search
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searching ? 'text-blue-500' : 'text-slate-600'}`}
                    size={18}
                  />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by book title..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-white outline-none focus:border-blue-500/50 transition-all shadow-inner"
                  />
                  {searching && (
                    <Loader2
                      className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500"
                      size={18}
                    />
                  )}
                </div>

                {/* RESULTS AREA */}
                <div className="space-y-5 min-h-25">
                  {/* LOCAL RESULTS */}
                  {localResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Database size={10} /> Already in BeBu Library
                      </p>
                      {localResults.map((book) => (
                        <SearchItem
                          key={book.public_id}
                          title={book.title}
                          author={book.authors.join(', ')}
                          cover={book.cover_img_url}
                          selected={selectedLocal?.public_id === book.public_id}
                          onClick={() => {
                            setSelectedLocal(book)
                            setSelectedGoogle(null)
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* GOOGLE RESULTS */}
                  {googleResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Globe size={10} /> New from Global Search
                      </p>
                      {googleResults.map((book) => (
                        <SearchItem
                          key={book.id}
                          title={book.volumeInfo.title}
                          author={
                            book.volumeInfo.authors?.join(', ') || 'Unknown'
                          }
                          cover={book.volumeInfo.imageLinks?.thumbnail}
                          selected={selectedGoogle?.id === book.id}
                          isGoogle
                          onClick={() => {
                            setSelectedGoogle(book)
                            setSelectedLocal(null)
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* EMPTY STATES */}
                  {!searching &&
                    query.length >= 2 &&
                    localResults.length === 0 &&
                    googleResults.length === 0 && (
                      <div className="text-center py-10 opacity-30 italic text-xs">
                        No books found matching this title.
                      </div>
                    )}
                </div>

                {/* SHELF STATUS SELECTOR */}
                {(selectedLocal || selectedGoogle) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-6 border-t border-white/5 space-y-4"
                  >
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Select Shelf Location
                    </label>
                    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                      {(
                        ['want_to_read', 'reading', 'done'] as ShelfStatus[]
                      ).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(s)}
                          className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${status === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* FOOTER */}
              <div className="p-6 border-t border-white/5 bg-white/1">
                <button
                  onClick={handleSave}
                  disabled={(!selectedLocal && !selectedGoogle) || isPending}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-blue-600/20 disabled:opacity-20 transition-all active:scale-95 cursor-pointer outline-none"
                >
                  {isPending ? 'Processing...' : 'Confirm & Add to Shelf'}
                </button>
              </div>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}

// --- SUB COMPONENT (Strictly Typed) ---
interface SearchItemProps {
  title: string
  author: string
  cover?: string
  selected: boolean
  onClick: () => void
  isGoogle?: boolean
}

function SearchItem({
  title,
  author,
  cover,
  selected,
  onClick,
  isGoogle,
}: SearchItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-4 ${selected ? (isGoogle ? 'bg-amber-600/10 border-amber-500/50' : 'bg-blue-600/10 border-blue-500/50') : 'bg-white/2 border-white/5 hover:bg-white/5'}`}
    >
      <div className="w-12 h-16 relative shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/5 shadow-md">
        {cover ? (
          <img src={cover} className="object-cover w-full h-full" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-700 font-bold uppercase text-center p-1 leading-tight">
            No Cover
          </div>
        )}
      </div>
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-sm font-bold text-white truncate leading-tight mb-1">
          {title}
        </p>
        <p className="text-[10px] text-slate-500 truncate font-medium">
          {author}
        </p>
      </div>
    </div>
  )
}
