'use client'

import { use } from 'react'
import BookReaderContent from '@/components/bookshelf/BookReaderContent'
import { useAuthStore } from '@/stores/useAuthStore'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = {
  params: Promise<{ username: string; id: string }>
}

export default function BookFullPage({ params }: Props) {
  const router = useRouter()
  const { username, id } = use(params)
  const { user: currentUser } = useAuthStore()

  const isMe = currentUser?.username === username

  return (
    <div className="w-full py-4">
      {/* Tombol Back manual karena ini di halaman penuh */}
      <button
        onClick={() => router.push(`/bookshelf/${username}`)}
        className="flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors cursor-pointer group"
      >
        <ChevronLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="text-sm font-bold uppercase tracking-widest">
          Back to Shelf
        </span>
      </button>

      {/* Kontainer yang meniru bentuk modal tapi tanpa posisi fixed */}
      <div className="bg-[#0B1220] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[70vh] flex flex-col">
        <BookReaderContent
          bookshelfId={Number(id)}
          initialData={null}
          isOwner={isMe}
          variant="page"
        />
      </div>
    </div>
  )
}
