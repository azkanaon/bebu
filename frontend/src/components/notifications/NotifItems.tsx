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
import { motion } from 'framer-motion'
import { AppNotification } from '@/types/notifications'

export default function NotifItem({ notif }: { notif: AppNotification }) {
  // Icon overlay berdasarkan tipe
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

  // Tentukan kemana user pergi saat klik notif
  const getLink = () => {
    if (notif.entityType === 'users') return `/${notif.actorUsername}`
    if (notif.entityType === 'posts') return `/posts/${notif.entityId}`
    return '#'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative group px-6 py-4 transition-all hover:bg-white/3 cursor-pointer ${!notif.isRead ? 'bg-blue-500/2' : ''}`}
    >
      <Link href={getLink()} className="flex items-start gap-4">
        {/* AVATAR DENGAN ICON OVERLAY */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-slate-800">
            {notif.actorAvatar ? (
              <div className="w-full h-full relative rounded-full overflow-hidden">
                <Image
                  src={notif.actorAvatar}
                  alt=""
                  fill
                  className="object-cover "
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                {notif.actorUsername.substring(0, 2)}
              </div>
            )}
          </div>
          {/* OVERLAY ICON */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0B1220] rounded-full flex items-center justify-center border border-white/10 shadow-lg">
            {getIcon()}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-w-0 py-1">
          <p
            className={`text-sm leading-relaxed ${!notif.isRead ? 'text-white' : 'text-slate-400'}`}
          >
            <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
              {notif.actorDisplayName || notif.actorUsername}
            </span>
            {notif.extraActorsCount > 0 &&
              ` and ${notif.extraActorsCount} others`}
            {/* Gunakan Sentence Case biasa di sini */}
            <span className="ml-1 text-slate-400">
              {getNotifText(notif.type)}
            </span>
          </p>

          {/* Tanggal juga dibuat lebih clean */}
          <p className="text-[10px] text-slate-600 mt-1 font-medium tracking-tight">
            {new Date(notif.createdAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>

        {/* INDICATOR DOT */}
        {!notif.isRead && (
          <div className="mt-2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        )}
      </Link>
    </motion.div>
  )
}

// Helper kecil khusus teks
function getNotifText(type: string) {
  const map: Record<string, string> = {
    POST_LIKE: 'liked your post.',
    POST_COMMENT: 'commented on your post.',
    POST_SAVE: 'saved your post to their library.',
    FOLLOW_REQUEST: 'wants to follow you.',
    FOLLOW_ACCEPT: 'accepted your follow request.',
    NEW_FOLLOWER: 'started following you.',
  }
  return map[type] || 'interacted with you.'
}
