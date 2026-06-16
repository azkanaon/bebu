'use client'

import { useEffect, useMemo, useRef, use, useState } from 'react'
import {
  ChevronLeft,
  MoreVertical,
  Loader2,
  Send,
  X,
  Search,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { format } from 'date-fns'
import { useQueryClient, InfiniteData } from '@tanstack/react-query'

import {
  useInfiniteMessages,
  useMarkChatAsRead,
  useSearchInConversation,
  useSendMessage,
} from '@/api/chat/useChat'
import { useAuthStore } from '@/stores/useAuthStore'
import { ChatMessage, InboxResponse } from '@/types/chat'
import { AnimatePresence, motion } from 'framer-motion'
import { HighlightText } from '@/lib/highlight-text'

type Props = {
  params: Promise<{ id: string }>
}

export default function ChatRoomPage({ params }: Props) {
  const resolvedParams = use(params)
  const conversationId = Number(resolvedParams.id)

  const [messageBody, setMessageBody] = useState('')
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const { mutate: sendMessage, isPending } = useSendMessage()

  const router = useRouter()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [localQuery, setLocalQuery] = useState('')
  const [debouncedLocalQuery, setDebouncedLocalQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLocalQuery(localQuery), 500)
    return () => clearTimeout(timer)
  }, [localQuery])

  const { data: searchResults, isFetching: isSearching } =
    useSearchInConversation(conversationId, debouncedLocalQuery)

  // 0. Kirim chat
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageBody.trim() || isPending) return

    // Kirim objek yang berisi payload (untuk BE) dan data reply (untuk FE)
    sendMessage(
      {
        payload: {
          conversation_id: conversationId,
          body: messageBody,
          parent_message_id: replyingTo?.id, // ID untuk Backend
        },
        replyingToData: replyingTo, // Objek lengkap untuk Optimistic UI
      },
      {
        onSuccess: () => {
          setMessageBody('')
          setReplyingTo(null) // Hapus preview reply setelah kirim
          scrollToBottom()
        },
      },
    )
  }

  const handleSetReply = (message: ChatMessage) => {
    setReplyingTo(message)

    // Opsional: Fokuskan kursor ke input bar secara otomatis saat klik reply
    const inputElement = document.querySelector(
      'input[placeholder="Type a message..."]',
    ) as HTMLInputElement
    inputElement?.focus()
  }

  // 1. AMBIL INFO PARTNER DARI CACHE INBOX (Agar Header Instan)
  const conversationInfo = useMemo(() => {
    const inbox = queryClient.getQueryData<InfiniteData<InboxResponse>>([
      'chat-inbox',
    ])
    const allConversations = inbox?.pages.flatMap((page) => page.data) || []
    return allConversations.find((c) => c.id === conversationId)
  }, [queryClient, conversationId])
  const isGroup = conversationInfo?.isGroup || false

  // 2. FETCH DATA PESAN
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteMessages(conversationId)

  // 3. MARK AS READ
  const { mutate: markAsRead } = useMarkChatAsRead()
  useEffect(() => {
    if (conversationId) markAsRead(conversationId)
  }, [conversationId, markAsRead])

  // 4. LOGIKA PENGURUTAN
  const allMessages = useMemo(() => {
    const flattened = data?.pages.flatMap((page) => page.data) || []
    return [...flattened].reverse()
  }, [data])

  // 5. AUTO SCROLL
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (!isFetchingNextPage) scrollToBottom()
  }, [allMessages.length, isFetchingNextPage])

  // 6. INFINITE SCROLL (TOP SENTINEL)
  const { ref: topRef, inView: topInView } = useInView()
  useEffect(() => {
    if (topInView && hasNextPage) fetchNextPage()
  }, [topInView, hasNextPage, fetchNextPage])

  if (isLoading) return <LoadingChat />

  return (
    <div className="flex flex-col h-full relative bg-transparent">
      {/* --- HEADER --- */}
      <header className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0B1220]/40 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          {/* Tombol Back hanya terlihat di Mobile (lg:hidden) */}
          <button
            onClick={() => router.push('/chat')}
            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer outline-none lg:hidden"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden relative">
              <Image
                src={conversationInfo?.partnerAvatar || '/default-avatar.png'}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0B1220] rounded-full" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-white leading-tight">
              {conversationInfo?.partnerName || 'Conversation'}
            </h2>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
              Active Now
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={`p-2 rounded-full transition-all cursor-pointer outline-none ${isSearchOpen ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
        >
          <Search size={20} />
        </button>
        {/* <button className="p-2 text-slate-500 hover:text-white cursor-pointer outline-none">
          <MoreVertical size={20} />
        </button> */}
      </header>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute top-[73px] left-0 right-0 z-20 bg-[#0B1220] border-b border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="p-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={14}
                />
                <input
                  autoFocus
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="Search in this conversation..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-10 text-xs text-white outline-none focus:border-blue-500/40"
                />
                {localQuery && (
                  <button
                    onClick={() => setLocalQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* HASIL PENCARIAN (List Kecil) */}
              <div className="mt-2 max-h-60 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="animate-spin text-blue-500" size={16} />
                  </div>
                ) : (
                  debouncedLocalQuery.length >= 2 &&
                  searchResults?.data.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        // Logic: Scroll ke pesan asli (nanti kita bahas)
                        setIsSearchOpen(false)
                      }}
                      className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                          {msg.senderDisplayName}
                        </span>
                        <span className="text-[8px] text-slate-600 font-bold">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                        <HighlightText
                          text={msg.body}
                          highlight={debouncedLocalQuery}
                        />
                      </p>
                    </button>
                  ))
                )}

                {debouncedLocalQuery.length >= 2 &&
                  searchResults?.data.length === 0 &&
                  !isSearching && (
                    <div className="py-6 text-center text-[10px] text-slate-600 uppercase font-black tracking-tighter">
                      No messages found
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MESSAGE AREA --- */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-[#070D18]/10"
      >
        {/* Sentinel Load Pesan Lama */}
        <div ref={topRef} className="h-10 flex justify-center items-center">
          {isFetchingNextPage && (
            <Loader2 size={16} className="animate-spin text-blue-500" />
          )}
        </div>

        {allMessages.map((msg, idx) => {
          if (!msg) return null
          return (
            <MessageWrapper
              key={msg.id}
              message={msg}
              isMe={msg.senderUsername === currentUser?.username}
              showTime={allMessages[idx + 1]?.senderId !== msg.senderId}
              isGroup={isGroup}
              onReply={handleSetReply}
            />
          )
        })}

        <div className="h-2" />
      </main>

      <footer className="p-4 bg-[#0B1220]/80 border-t border-white/5 backdrop-blur-md">
        {/* PREVIEW REPLY (Jika sedang membalas) */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 p-3 bg-white/5 rounded-2xl border-l-4 border-blue-500 flex justify-between items-center"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  Replying to {replyingTo.senderDisplayName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {replyingTo.body}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 bg-white/5 p-2 pl-4 rounded-4xl border border-white/10 focus-within:border-blue-500/50 transition-all"
        >
          <input
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white py-2"
          />
          <button
            type="submit"
            disabled={!messageBody.trim() || isPending}
            className="p-2.5 bg-blue-600 text-white rounded-full disabled:opacity-20 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-90"
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </footer>
    </div>
  )
}

// Komponen MessageWrapper (Handle System/Text/Share)
function MessageWrapper({
  message,
  isMe,
  showTime,
  isGroup,
  onReply,
}: {
  message: ChatMessage
  isMe: boolean
  showTime: boolean
  isGroup: boolean
  onReply: (message: ChatMessage) => void
}) {
  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Mencegah bubble diklik jika ada fungsi lain
    onReply(message) // Kirim objek pesan ini ke induk
  }

  // 1. HANDLE PESAN SISTEM (TETAP DI TENGAH)
  if (message.messageType === 'system') {
    return (
      <div className="w-full flex justify-center my-2 px-4">
        <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
            {message.body}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex w-full gap-2 items-end px-4 ${isMe ? 'flex-row-reverse' : 'flex-row'} group animate-in fade-in slide-in-from-bottom-1 duration-300`}
    >
      {/* 2. FOTO PROFIL (Hanya muncul jika: Bukan Pesan Saya DAN ini adalah Grup) */}
      {!isMe && isGroup && (
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-slate-800 shrink-0 mb-5 shadow-sm">
          <Image
            src={message.senderAvatar || '/default-avatar.png'}
            alt={message.senderDisplayName || 'user'}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* 3. KONTEN PESAN (REPLY + BUBBLE + TIME) */}
      <div
        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}
      >
        {/* NAMA PENGIRIM (Hanya muncul jika: Bukan Pesan Saya DAN ini adalah Grup) */}
        {!isMe && isGroup && (
          <span className="text-[10px] font-black text-slate-500 mb-1 ml-2 uppercase tracking-[0.15em]">
            {message.senderDisplayName || message.senderUsername || 'Anonymous'}
          </span>
        )}

        {/* REPLY PREVIEW */}
        {message.replyTo && (
          <div className="mb-1 rounded-xl bg-white/5 backdrop-blur-sm px-3 py-2 border-l-4 border-blue-500/50 max-w-[90%] shadow-sm">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-tight">
              {message.replyTo.senderName}
            </p>
            <p className="text-[11px] text-slate-400 truncate italic">
              {message.replyTo.body}
            </p>
          </div>
        )}

        {/* BUBBLE UTAMA */}
        <div
          className={`px-4 py-3 rounded-[1.8rem] text-sm leading-relaxed shadow-md transition-all ${
            isMe
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/10'
          }`}
        >
          {/* PESAN TEKS */}
          {message.messageType === 'text' && (
            <p className="whitespace-pre-wrap">{message.body}</p>
          )}

          {/* SHARE BOOK */}
          {message.messageType === 'share_book' && message.sharedBook && (
            <div className="flex gap-3 bg-black/20 p-2 rounded-2xl border border-white/5 my-1 hover:bg-black/30 transition-all cursor-pointer">
              <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-lg">
                <Image
                  src={message.sharedBook.coverImgUrl || '/placeholder.png'}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {message.sharedBook.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {message.sharedBook.authors[0]}
                </p>
              </div>
            </div>
          )}

          {/* SHARE POST */}
          {message.messageType === 'share_post' && message.sharedPost && (
            <div className="bg-black/20 p-3 rounded-2xl border border-white/5 my-1 hover:bg-black/30 transition-all cursor-pointer space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-700 shadow-inner" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  Shared Post
                </span>
              </div>
              <p className="text-xs text-slate-300 italic line-clamp-2 leading-relaxed">
                &quot;{message.sharedPost.description}&quot;
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleReplyClick} // <--- PASANG DI SINI
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 px-2 py-0.5 rounded-md hover:bg-white/5 text-[9px] font-black text-blue-500 uppercase tracking-widest cursor-pointer outline-none"
        >
          Reply
        </button>

        {/* 4. TIMESTAMP (Muncul saat hover kartu) */}
        {showTime && (
          <span className="text-[9px] text-slate-600 mt-1 font-black uppercase tracking-tighter px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {format(new Date(message.createdAt), 'hh:mm a')}
          </span>
        )}
      </div>
    </div>
  )
}

function LoadingChat() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
      <Loader2 size={32} className="animate-spin text-blue-500" />
      <p className="text-[9px] font-black uppercase tracking-[0.2em]">
        Establishing Connection...
      </p>
    </div>
  )
}
