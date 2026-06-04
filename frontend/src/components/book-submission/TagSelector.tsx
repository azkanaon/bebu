'use client'
import { useState, useEffect } from 'react'
import { X, Plus, Loader2, Check } from 'lucide-react'
import { AuthorInput, GenreInput, SearchResultItem } from '@/types/submission'
import { AnimatePresence, motion } from 'framer-motion'

interface TagSelectorProps {
  label: string
  placeholder: string
  selectedTags: (AuthorInput | GenreInput)[]
  onAdd: (tag: AuthorInput | GenreInput) => void
  onRemove: (index: number) => void
  searchFn: (q: string) => Promise<{ data: SearchResultItem[] }>
}

export default function TagSelector({
  label,
  placeholder,
  selectedTags,
  onAdd,
  onRemove,
  searchFn,
}: TagSelectorProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 1) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const res = await searchFn(query)
        setResults(res.data)
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query, searchFn])

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
        {label}
      </label>

      {/* Tags terpilih tetap di sini */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2"
          >
            {tag.name}
            <X
              size={12}
              className="cursor-pointer hover:text-white"
              onClick={() => onRemove(idx)}
            />
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
        />
        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500"
            size={16}
          />
        )}

        {/* DROPDOWN HASIL SEARCH */}
        <AnimatePresence>
          {query.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              // max-h-40 membatasi hanya muncul sekitar 4-5 item saja agar modal tidak jebol
              className="absolute z-50 w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 max-h-40 overflow-y-auto custom-scrollbar"
            >
              {results.length > 0
                ? results.map((item) => {
                    const isAlreadySelected = selectedTags.some(
                      (t) => t.id === item.id,
                    )
                    return (
                      <button
                        key={item.id}
                        disabled={isAlreadySelected}
                        onClick={() => {
                          onAdd({ id: item.id, name: item.name })
                          setQuery('')
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors mb-0.5 ${isAlreadySelected ? 'opacity-30 cursor-not-allowed' : 'text-slate-300 hover:bg-white/10'}`}
                      >
                        {item.name}
                        {isAlreadySelected && <Check size={12} />}
                      </button>
                    )
                  })
                : !loading && (
                    <p className="px-3 py-2 text-[10px] text-slate-500 italic">
                      No existing data found
                    </p>
                  )}

              {/* Tombol Add New selalu di paling bawah */}
              <button
                onClick={() => {
                  onAdd({ name: query })
                  setQuery('')
                }}
                className="w-full text-left px-3 py-2.5 text-xs text-blue-400 hover:bg-blue-500/10 rounded-xl flex items-center gap-2 font-bold mt-1 border-t border-white/5"
              >
                <div className="p-1 bg-blue-500/20 rounded-lg">
                  <Plus size={12} />
                </div>
                <span>Add new: &quot;{query}&quot;</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
