'use client'

import { useInfiniteSearchBooks } from '@/api/search/useSearch'
import { useInView } from 'react-intersection-observer'
import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Star, Loader2 } from 'lucide-react'
import { LoadingSpinner } from './Loading'
import NoResults from './NoResults'

export default function BooksResults({ query }: { query: string }) {
  const { ref, inView } = useInView()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteSearchBooks(query)

  const allBooks = useMemo(
    () => data?.pages.flatMap((p) => p.data) || [],
    [data],
  )

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  if (isLoading) return <LoadingSpinner />

  if (!isLoading && allBooks.length === 0) {
    return <NoResults query={query} category="books" />
  }

  return (
    <div className="grid grid-cols-2 gap-4 px-2">
      {allBooks.map((book) => (
        <div
          key={book.public_id}
          className="bg-white/2 border border-white/5 p-3 rounded-2xl flex flex-col gap-3 group cursor-pointer hover:border-amber-500/20 transition-all"
        >
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg bg-slate-800">
            {book.cover_img_url ? (
              <Image
                src={book.cover_img_url}
                alt={book.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 uppercase">
                No Cover
              </div>
            )}
          </div>
          <div className="px-1">
            <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
              {book.title}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {book.authors[0]}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={10} fill="currentColor" />
                <span className="text-[10px] font-bold text-slate-300">
                  {book.rating}
                </span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">
                {book.publication_year}
              </span>
            </div>
          </div>
        </div>
      ))}
      <div ref={ref} className="col-span-2 py-10 flex justify-center">
        {isFetchingNextPage && (
          <Loader2 className="animate-spin text-blue-500" />
        )}
      </div>
    </div>
  )
}
