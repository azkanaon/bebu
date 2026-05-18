'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, BookPlus } from 'lucide-react'
import { externalService } from '@/services/external.service'
import { GoogleBookVolume } from '@/types/google-books'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bookshelfService } from '@/services/bookshelf.service'
import { ShelfStatus } from '@/types/bookshelf'
import { toast } from 'sonner'
import ClientPortal from '../ClientPortal'
import Image from 'next/image'

export default function AddBookModal({
  open,
  onClose,
  username,
}: {
  open: boolean
  onClose: () => void
  username: string
}) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GoogleBookVolume[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedBook, setSelectedBook] = useState<GoogleBookVolume | null>(
    null,
  )
  const [status, setStatus] = useState<ShelfStatus>('want_to_read')

  const handleSearch = async () => {
    if (!query) return
    setSearching(true)
    try {
      const data = await externalService.searchGoogleBooks(query)

      // TAMBAHKAN INI UNTUK MENGECEK DI CONSOLE
      console.log('DATA DARI GOOGLE:', data)
      console.log('CONTOH BUKU PERTAMA:', data.items?.[0]?.volumeInfo)

      setResults(data.items || [])
    } catch (error) {
      console.error(error)
    } finally {
      setSearching(false)
    }
  }

  const { mutate: addToShelf, isPending } = useMutation({
    // Kita ubah agar mutationFn menerima objek payload
    mutationFn: (payload: any) => bookshelfService.addBookToShelf(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookshelf', username] })
      toast.success('Book added successfully!')
      onClose()
    },
  })

  const handlePrepareAndSave = () => {
    if (!selectedBook) return

    const info = selectedBook.volumeInfo

    // Susun paket sesuai DTO yang kita bahas tadi
    const payload = {
      google_book_id: selectedBook.id,
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
      shelf_status: status, // dari state status modal ('reading', dll)
    }

    // Jalankan mutasi dengan paket data di atas
    addToShelf(payload)
  }

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-150 bg-black/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-160 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pointer-events-auto w-full max-w-lg bg-[#0B1220] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <BookPlus size={16} className="text-blue-500" /> Add New Book
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* SEARCH SECTION */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search title or author..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-5 pr-12 text-sm text-white outline-none focus:border-blue-500/50"
                    />
                    <button
                      onClick={handleSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-blue-500"
                    >
                      {searching ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Search size={18} />
                      )}
                    </button>
                  </div>

                  {/* RESULTS */}
                  <div className="space-y-2">
                    {results.map((book) => (
                      <div
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-4 ${selectedBook?.id === book.id ? 'bg-blue-600/10 border-blue-500/50' : 'bg-white/2 border-white/5 hover:bg-white/5'}`}
                      >
                        <div className="w-12 h-16 relative shrink-0 rounded-lg overflow-hidden bg-white/5">
                          {book.volumeInfo.imageLinks?.thumbnail && (
                            <img
                              src={book.volumeInfo.imageLinks.thumbnail}
                              className="object-cover w-full h-full"
                              alt=""
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {book.volumeInfo.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {book.volumeInfo.authors?.join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SHELF SETTINGS */}
                {selectedBook && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4 border-t border-white/5 space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Select Shelf
                      </label>
                      <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                        {(
                          ['want_to_read', 'reading', 'done'] as ShelfStatus[]
                        ).map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${status === s ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                            {s.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-6 border-t border-white/5">
                <button
                  // GANTI DI SINI: Panggil fungsi penyusun tadi
                  onClick={handlePrepareAndSave}
                  disabled={!selectedBook || isPending}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl ..."
                >
                  {isPending ? 'Processing...' : 'Add to Bookshelf'}
                </button>
              </div>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}
