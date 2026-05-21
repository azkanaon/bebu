import { Loader2 } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">
        Searching Database...
      </p>
    </div>
  )
}
