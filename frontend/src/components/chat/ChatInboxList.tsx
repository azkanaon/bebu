'use client'

import { useState, useMemo, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { Loader2, Search, Edit, Users, MessageSquare } from 'lucide-react'
import {
  useInfiniteInbox,
  useSearchConversations,
  useSearchMessagesGlobal,
} from '@/api/chat/useChat'
import { Conversation, SearchMessageResult } from '@/types/chat'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { useParams } from 'next/navigation' // Untuk deteksi chat mana yang aktif
import { HighlightText } from '@/lib/highlight-text'

export default function ChatInboxList() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const { ref, inView } = useInView()
  const params = useParams()
  const activeId = params?.id ? Number(params.id) : null

  const isSearching = debouncedQuery.length >= 2
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteInbox()
  const { data: convResults, isFetching: searchingConv } =
    useSearchConversations(debouncedQuery)
  const { data: msgResults, isFetching: searchingMsg } =
    useSearchMessagesGlobal(debouncedQuery)

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500)
    return () => clearTimeout(timer)
  }, [query])

  const allConversations = useMemo(() => {
    return data?.pages.flatMap((page) => page.data ?? []) || []
  }, [data])

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* HEADER */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white tracking-tight">
            Messages
          </h1>
          <div className="flex gap-1">
            <button className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer outline-none">
              <Users size={18} />
            </button>
            <button className="p-2 text-slate-500 hover:text-white cursor-pointer outline-none">
              <Edit size={18} />
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-blue-500' : 'text-slate-600'}`}
            size={14}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people or messages..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500/40 transition-all"
          />
          {(searchingConv || searchingMsg) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 size={12} className="animate-spin text-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* LIST AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 divide-y divide-white/5">
        {isLoading && !isSearching && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Syncing Conversations...
            </p>
          </div>
        )}
        {!isSearching ? (
          <>
            {allConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeId === conv.id}
              />
            ))}

            <div ref={ref} className="py-6 flex justify-center">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin text-blue-500" size={16} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">
                    Loading more...
                  </span>
                </div>
              ) : hasNextPage ? (
                <div className="h-1" /> // Trigger area
              ) : allConversations.length > 0 ? (
                <p className="text-[9px] text-slate-700 font-bold uppercase tracking-tighter">
                  All conversations loaded
                </p>
              ) : null}
            </div>
          </>
        ) : (
          /* --- TAMPILAN HASIL PENCARIAN --- */
          <div className="space-y-6 pt-2">
            {/* KATEGORI 1: CHATS (PEOPLE/GROUPS) */}
            {convResults?.data && convResults.data.length > 0 && (
              <section className="space-y-1">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-3 mb-2">
                  Conversations
                </p>
                {convResults.data.map((conv) => (
                  <SearchConvItem
                    key={conv.id}
                    conv={conv}
                    highlight={debouncedQuery}
                  />
                ))}
              </section>
            )}

            {/* KATEGORI 2: MESSAGES (ISI CHAT) */}
            {msgResults?.data && msgResults.data.length > 0 && (
              <section className="space-y-1 pb-10">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-3 mb-2">
                  Message History
                </p>
                {msgResults.data.map((msg) => (
                  <SearchMsgItem
                    key={msg.id}
                    msg={msg}
                    highlight={debouncedQuery}
                  />
                ))}
              </section>
            )}

            {/* EMPTY STATE SEARCH */}
            {!searchingConv &&
              !searchingMsg &&
              convResults?.data?.length === 0 &&
              msgResults?.data.length === 0 && (
                <div className="py-20 text-center opacity-40 italic text-xs">
                  No matches found for &quot;{debouncedQuery}&quot;
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}

// --- SUB-COMPONENT ITEM ---
interface ItemProps {
  conversation: Conversation
  isActive: boolean
}

function ConversationItem({ conversation, isActive }: ItemProps) {
  const relativeTime = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(conversation.updatedAt), {
        addSuffix: false,
      })
        .replace('about ', '')
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' days', 'd')
        .replace(' day', 'd')
    } catch {
      return ''
    }
  }, [conversation.updatedAt])

  return (
    <Link href={`/chat/${conversation.id}`} className="block">
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 group cursor-pointer my-1 ${
          isActive
            ? 'bg-blue-600/10 border border-blue-500/20 shadow-inner'
            : 'hover:bg-white/5 border border-transparent'
        }`}
      >
        {/* AVATAR */}
        <div className="relative shrink-0">
          <div
            className={`relative w-12 h-12 rounded-full overflow-hidden border transition-colors bg-slate-800 ${
              isActive ? 'border-blue-500/50' : 'border-white/10'
            }`}
          >
            <Image
              src={conversation.partnerAvatar || '/default-avatar.png'}
              alt={conversation.partnerName}
              fill
              className="object-cover"
            />
          </div>

          {conversation.unreadCount > 0 && !isActive && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-[#0B1220] rounded-full animate-pulse" />
          )}
        </div>

        {/* TEXT */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <h3
              className={`text-xs truncate transition-colors ${
                isActive || conversation.unreadCount > 0
                  ? 'text-white font-bold'
                  : 'text-slate-300 font-semibold'
              }`}
            >
              {conversation.partnerName}
            </h3>
            <span className="text-[9px] text-slate-600 font-bold whitespace-nowrap ml-2 uppercase">
              {relativeTime}
            </span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <p
              className={`text-[11px] truncate leading-tight ${
                isActive || conversation.unreadCount > 0
                  ? 'text-slate-100 font-medium'
                  : 'text-slate-500'
              }`}
            >
              {conversation.lastMessage}
            </p>

            {conversation.unreadCount > 0 && !isActive && (
              <div className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-4 text-center shadow-lg shadow-blue-600/20">
                {conversation.unreadCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function SearchConvItem({
  conv,
  highlight,
}: {
  conv: Conversation
  highlight: string
}) {
  return (
    <Link href={`/chat/${conv.id}`} className="block">
      <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group">
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden relative shrink-0">
          <Image
            src={conv.partnerAvatar || '/default-avatar.png'}
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-white truncate">
            <HighlightText text={conv.partnerName} highlight={highlight} />
          </h4>
          <p className="text-[10px] text-slate-500 truncate">
            @{conv.partnerName.toLowerCase()}
          </p>
        </div>
      </div>
    </Link>
  )
}

function SearchMsgItem({
  msg,
  highlight,
}: {
  msg: SearchMessageResult
  highlight: string
}) {
  return (
    <Link href={`/chat/${msg.conversationId}`} className="block">
      <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5">
        <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-600 shrink-0">
          <MessageSquare size={16} />
        </div>
        <div className="min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <h4 className="text-[10px] font-bold text-slate-300 truncate">
              {msg.partnerName || 'User'}
            </h4>
            <span className="text-[8px] text-slate-600 font-medium">
              {new Date(msg.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-1 italic leading-tight">
            <HighlightText text={msg.body} highlight={highlight} />
          </p>
        </div>
      </div>
    </Link>
  )
}
