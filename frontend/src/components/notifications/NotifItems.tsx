'use client'

import {
  Heart,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  Bookmark,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AppNotification } from '@/types/notifications'

export default function NotifItem({ notif }: { notif: AppNotification }) {
  // 1. Icon overlay berdasarkan tipe (Sudah Diintegrasikan)
  const getIcon = () => {
    switch (notif.type) {
      case 'POST_LIKE':
        return <Heart size={12} fill="currentColor" className="text-pink-500" />
      case 'POST_COMMENT':
        return (
          <MessageSquare
            size={12}
            fill="currentColor"
            className="text-blue-500"
          />
        )
      case 'FOLLOW_REQUEST':
        return <UserPlus size={12} className="text-amber-500" />
      case 'FOLLOW_ACCEPT':
        return <CheckCircle2 size={12} className="text-emerald-500" />
      case 'POST_SAVE':
        return (
          <Bookmark size={12} fill="currentColor" className="text-purple-500" />
        )
      default:
        return null
    }
  }

  // 2. Tentukan kemana user pergi saat klik notif
  const getLink = () => {
    if (notif.entityType === 'users') return `/${notif.actorUsername}`
    if (notif.entityType === 'posts') return `/posts/${notif.entityId}`
    return '#'
  }

  return (
    <Link
      href={getLink()}
      className={`relative px-6 py-5 transition-all duration-500 group flex items-start gap-4 border-l-4 ${
        !notif.isRead
          ? 'bg-blue-600/5 border-blue-500'
          : 'bg-transparent border-transparent'
      }`}
    >
      {/* AVATAR DENGAN GLOW */}
      <div className="relative shrink-0">
        <div
          className={`border-2 transition-colors w-12 h-12 rounded-full overflow-hidden ${
            !notif.isRead
              ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
              : 'border-white/10'
          }`}
        >
          <div className="relative w-full h-full">
            <Image
              src={notif.actorAvatar || '/default-avatar.png'}
              alt={notif.actorUsername}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Badge Icon (Like/Comment) */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0B1220] rounded-full flex items-center justify-center border border-white/10 shadow-lg">
          {getIcon()}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0 py-0.5">
        <p
          className={`text-sm leading-relaxed ${!notif.isRead ? 'text-white font-medium' : 'text-slate-400'}`}
        >
          <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
            {notif.actorDisplayName || notif.actorUsername}
          </span>
          {notif.extraActorsCount > 0 && (
            <span className="text-slate-500">
              {' '}
              and {notif.extraActorsCount} others
            </span>
          )}
          <span className="ml-1 text-slate-400">
            {getNotifText(notif.type)}
          </span>
        </p>

        <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest font-bold">
          {new Date(notif.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* UNREAD INDICATOR (GLOWING DOT) */}
      {!notif.isRead && (
        <div className="mt-2 relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </div>
      )}
    </Link>
  )
}

// Helper teks deskripsi (Sentence Case)
function getNotifText(type: string) {
  const map: Record<string, string> = {
    POST_LIKE: 'liked your post.',
    POST_COMMENT: 'commented on your post.',
    POST_SAVE: 'saved your post.',
    FOLLOW_REQUEST: 'wants to follow you.',
    FOLLOW_ACCEPT: 'accepted your follow request.',
    NEW_FOLLOWER: 'started following you.',
    COMMENT_LIKE: 'liked your comment.',
    COMMENT_REPLY: 'replied to your comment.',
  }
  return map[type] || 'interacted with you.'
}
