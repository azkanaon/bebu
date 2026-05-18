'use client'

import { useInfiniteBookshelf } from '@/api/bookshelf/useBookshelf'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, BookImage } from 'lucide-react'

interface Props {
  username: string
}

export default function BookshelfShowcase({ username }: Props) {
  // Ambil data dengan limit 6 saja
  const { data, isLoading } = useInfiniteBookshelf(username, 'reading')
  // Catatan: Kamu bisa modifikasi hook atau API agar mengambil semua status tapi limit 6

  const books = data?.pages[0]?.data.slice(0, 6) || []

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="py-10 text-center border border-dashed border-white/5 rounded-3xl">
        <p className="text-sm text-slate-500 italic">
          No books in the shelf yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* GRID 3 KOLOM (Ideal untuk Etalase Profil) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {books.map((item) => (
          <Link
            key={item.publicId}
            href={`/bookshelf/${username}`} // Arahkan ke halaman full bookshelf user tersebut
            className="group relative aspect-3/4 rounded-lg overflow-hidden border border-white/5 bg-white/5"
          >
            {item.book.coverImgUrl ? (
              <Image
                src={item.book.coverImgUrl}
                alt={item.book.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookImage className="text-slate-700" size={24} />
              </div>
            )}

            {/* Progress Overlay Kecil */}
            <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white border border-white/10">
              {item.progress}%
            </div>
          </Link>
        ))}
      </div>

      {/* Tombol Lihat Semua */}
      <Link
        href={`/bookshelf/${username}`}
        className="block w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all"
      >
        View Full Bookshelf
      </Link>
    </div>
  )
}
