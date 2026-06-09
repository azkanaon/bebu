'use client'

import { Lock, Library } from 'lucide-react'

export default function PrivateBookshelfWall() {
  return (
    <div className="w-full py-24 flex flex-col items-center justify-center bg-[#0B1220]/40 border border-dashed border-white/5 rounded-[2.5rem] text-center px-6">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full scale-150" />
        <div className="relative w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-500">
          <Library size={32} strokeWidth={1.5} />
          <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-[#0B1220]">
            <Lock size={10} className="text-white" />
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-2">
        This bookshelf is private
      </h2>

      <p className="text-sm text-slate-500 max-w-70 leading-relaxed">
        The owner has restricted access to their book collection and reading
        notes.
      </p>
    </div>
  )
}
