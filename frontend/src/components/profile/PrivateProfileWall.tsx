import { Lock } from 'lucide-react'

export function PrivateProfileWall() {
  return (
    <div className="py-20 flex flex-col items-center justify-center bg-[#0B1220]/40 border border-dashed border-white/5 rounded-[3rem] text-center px-6">
      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
        <Lock size={32} className="text-slate-500" />
      </div>

      <h2 className="text-lg font-semibold text-white mb-2">
        This account is private
      </h2>

      <p className="text-sm text-slate-500 max-w-70 leading-relaxed">
        Follow this user to see their reading activities, achievements, and
        bookshelves.
      </p>
    </div>
  )
}

// Placeholder sederhana agar tidak error
