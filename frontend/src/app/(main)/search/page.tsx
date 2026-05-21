'use client'

import { useState, useEffect, Suspense } from 'react' // 1. Tambahkan Suspense
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import TopResults from '@/components/search/TopResults'

type SearchTab = 'top' | 'people' | 'books' | 'posts'

// Komponen Internal agar useSearchParams aman di dalam Suspense
function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const query = searchParams.get('q') || ''
  const activeTab = (searchParams.get('tab') as SearchTab) || 'top'

  const [inputValue, setLocalInput] = useState(query)

  // Update URL saat user mengetik (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim()) {
        router.push(`/search?q=${inputValue}&tab=${activeTab}`)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [inputValue, activeTab, router])

  // FUNGSI INI SEKARANG ADA DI DALAM AGAR BISA DIAKSES
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
      {/* 1. SEARCH HEADER */}
      <div className="sticky top-0 z-20 bg-[#0B1220]/80 backdrop-blur-md pb-2">
        <motion.div layoutId="search-bar-container" className="relative pt-4">
          <Search
            className="absolute left-4 top-[2.15rem] text-blue-500"
            size={20}
          />
          <input
            autoFocus
            value={inputValue}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="Search BeBu library..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-base text-white outline-none focus:border-blue-500/30 transition-all shadow-2xl"
          />
          {inputValue && (
            <button
              onClick={() => setLocalInput('')}
              className="absolute right-4 top-[2.15rem] p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* 2. TABS NAVIGASI */}
        <div className="flex items-center border-b border-white/5 mt-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                router.push(`/search?q=${inputValue}&tab=${tab.id}`)
              }
              className={`relative px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
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

      {/* 3. CONTENT AREA */}
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
              <EmptySearchState />
            ) : (
              // Panggil Switch Case di sini
              <div className="w-full">
                {activeTab === 'top' && <TopResults onSeeAll={handleSeeAll} />}
                {activeTab === 'people' && (
                  <DefaultComingSoon label="People search" />
                )}
                {activeTab === 'books' && (
                  <DefaultComingSoon label="Full books list" />
                )}
                {activeTab === 'posts' && (
                  <DefaultComingSoon label="All posts" />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// Komponen Pembungkus Suspense (Penting untuk Next.js)
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Search className="animate-pulse text-slate-700" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}

function EmptySearchState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <Search size={48} className="mb-4 opacity-20" />
      <p className="text-sm font-medium uppercase tracking-widest">
        Type to search BeBu
      </p>
    </div>
  )
}

function DefaultComingSoon({ label }: { label: string }) {
  return (
    <div className="py-20 text-center text-slate-500 text-xs italic">
      {label} coming soon...
    </div>
  )
}
