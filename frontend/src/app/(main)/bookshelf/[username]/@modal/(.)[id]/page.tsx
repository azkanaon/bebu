'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import BookModal from '@/components/bookshelf/BookModal'
import { useAuthStore } from '@/stores/useAuthStore'

type Props = {
  params: Promise<{ username: string; id: string }>
}

export default function BookModalIntercept({ params }: Props) {
  const router = useRouter()
  const { username, id } = use(params)
  const { user: currentUser } = useAuthStore()

  // Logic: Cek apakah yang melihat adalah pemilik rak buku
  const isMe = currentUser?.username === username

  const handleClose = () => {
    // Saat modal ditutup, URL akan kembali ke /bookshelf/[username]
    router.back()
  }

  return (
    <BookModal
      open={true}
      onClose={handleClose}
      bookshelfId={Number(id)}
      initialData={null} // Di interceptor, kita biarkan BookReaderContent fetch data fresh via id
      isOwner={isMe}
    />
  )
}
