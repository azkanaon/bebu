import { MySubmissionItem } from '@/types/submission'
import { Pencil, Trash2 } from 'lucide-react'
import Image from 'next/image'

export function SubmissionCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MySubmissionItem
  onEdit: () => void
  onDelete: () => void
}) {
  const initialLetter = item.title.charAt(0).toUpperCase()

  return (
    <div className="group relative bg-[#0B1220]/60 border border-white/5 p-5 rounded-4xl hover:border-white/10 transition-all flex gap-5 items-start overflow-hidden">
      {/* PLACEHOLDER / IMAGE */}
      <div className="relative w-20 h-28 shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        {item.coverImgUrl ? (
          <Image
            src={item.coverImgUrl}
            alt=""
            fill
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-3xl font-black text-slate-700">
            {initialLetter}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col h-full py-1">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
              {item.title}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {item.authors.join(', ') || 'No Author'}
            </p>
          </div>

          <div className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest">
            {item.status}
          </div>
        </div>

        {/* User Note Preview */}
        {item.userNote && (
          <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-1 mb-3">
            &quot;{item.userNote}&quot;
          </p>
        )}

        {/* Footer Info */}
        <div className="mt-auto flex justify-between items-center">
          <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* HOVER ACTIONS (DI POJOK KANAN BAWAH) */}
      <div className="absolute bottom-4 right-4 flex gap-2 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={(e) => {
            e.preventDefault()
            onEdit()
          }}
          className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-blue-600 border border-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            onDelete()
          }}
          className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-red-600 border border-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
