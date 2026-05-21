'use client'

import { motion } from 'framer-motion'
import { SearchX } from 'lucide-react'

interface Props {
  query: string
  category?: string
}

export default function NoResults({ query, category }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div className="relative mb-6">
        {/* Lingkaran dekoratif di belakang icon */}
        <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full scale-150" />
        <div className="relative w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-500">
          <SearchX size={32} strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-2 uppercase tracking-tight">
        No {category ? category : 'results'} found
      </h3>

      <p className="text-sm text-slate-500 max-w-70 leading-relaxed">
        We couldn&apos;t find any matches for{' '}
        <span className="text-blue-400 font-medium">&quot; {query}&quot;</span>.
        Try checking the spelling or use more general keywords.
      </p>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
      >
        Try a different search
      </button>
    </motion.div>
  )
}
