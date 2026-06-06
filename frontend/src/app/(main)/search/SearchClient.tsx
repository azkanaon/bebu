'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import TopResults from '@/components/search/TopResults'

// IMPORT HOOKS ASLI
import { useTopSearch } from '@/api/search/useSearch'
import PeopleResults from '@/components/search/PeopleResults'
import BooksResults from '@/components/search/BooksResults'
import PostsResults from '@/components/search/PostsResults'
import SearchHistoryList from '@/components/search/SearchHistory'

type SearchTab = 'top' | 'people' | 'books' | 'posts'

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const query = searchParams.get('q') || ''
  const activeTab = (searchParams.get('tab') as SearchTab) || 'top'

  const [inputValue, setLocalInput] = useState(query)

  // 1. FETCH DATA TOP RESULTS (Hanya jalan jika tab 'top' & query ada)
  const {
    data: topData,
    isLoading: loadingTop,
    isFetching: fetchingTop,
  } = useTopSearch(query)

  // Update URL saat user mengetik (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim()) {
        router.push(`/search?q=${inputValue}&tab=${activeTab}`)
      } else {
        router.push(`/search`) // Bersihkan URL jika input kosong
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [inputValue, activeTab, router])

  const handleSeeAll = (tabId: string) => {
    router.push(`/search?q=${inputValue}&tab=${tabId}`)
  }

  const tabs: { id: SearchTab; label: string }[] = [
    { id: 'top', label: 'Top' },
    { id: 'people', label: 'People' },
    { id: 'books', label: 'Books' },
    { id: 'posts', label: 'Posts' },
  ]

  return (
    <div className="flex flex-col min-h-screen text-slate-200">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-[#0B1220]/80 backdrop-blur-md pb-2">
        <motion.div layoutId="search-bar-container" className="relative pt-4">
          <Search
            className={`absolute left-4 top-[2.15rem] transition-colors ${fetchingTop ? 'text-blue-400' : 'text-slate-500'}`}
            size={20}
          />
          <input
            autoFocus
            value={inputValue}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="Search BeBu library..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-base text-white outline-none focus:border-blue-500/30 transition-all shadow-2xl"
          />
          {fetchingTop && (
            <div className="absolute right-12 top-[2.15rem]">
              <Loader2 className="animate-spin text-blue-500" size={18} />
            </div>
          )}
          {inputValue && (
            <button
              onClick={() => setLocalInput('')}
              className="absolute right-4 top-[2.15rem] p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* TABS */}
        <div className="flex items-center border-b border-white/5 mt-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                router.push(`/search?q=${inputValue}&tab=${tab.id}`)
              }
              className={`relative px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <main className="flex-1 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + query}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {!query ? (
              <SearchHistoryList
                onSelect={(selectedQuery) => {
                  setLocalInput(selectedQuery) // Masukkan ke input
                  // URL akan otomatis update karena useEffect debounce yang sudah kita buat
                }}
              />
            ) : (
              <div className="w-full">
                {activeTab === 'top' &&
                  (loadingTop ? (
                    <LoadingResults />
                  ) : (
                    <TopResults
                      data={topData}
                      onSeeAll={handleSeeAll}
                      query={query}
                    />
                  ))}

                {activeTab === 'people' && <PeopleResults query={query} />}
                {activeTab === 'books' && <BooksResults query={query} />}
                {activeTab === 'posts' && <PostsResults query={query} />}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function SearchClient() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-slate-700" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}

function LoadingResults() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        Curating best results...
      </p>
    </div>
  )
}
