// app/(main)/chat/layout.tsx
'use client'

import ChatInboxList from '@/components/chat/ChatInboxList'
import { ReactNode } from 'react'

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-2rem)] bg-[#0B1220]/60 border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl">
      {/* 
         KOLOM KIRI (INBOX):
         - hidden di mobile (agar tidak double saat buka Chat Room)
         - flex di desktop (lg)
      */}
      <aside className="hidden lg:flex w-87.5 border-r border-white/5 flex-col shrink-0 bg-[#0B1220]/40">
        <ChatInboxList />
      </aside>

      {/* 
         KOLOM KANAN (KONTEN):
         - Menampilkan ChatMainPage (Placeholder) saat di /chat
         - Menampilkan ChatRoomPage saat di /chat/[id]
      */}
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  )
}
