'use client'

import {
  Home,
  Book,
  MessageCircle,
  Bell,
  Search,
  Shield,
  Flag,
  User,
  Library,
} from 'lucide-react'
import { SidebarItem } from './SidebarItem'
import { UserProfile } from './UserProfile'
import Image from 'next/image'
import { User as TypeUser } from '@/types/auth'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUnreadNotificationCount } from '@/api/notifications/useNotifications'

interface SidebarProps {
  user: TypeUser | null
}

export default function Sidebar({ user }: SidebarProps) {
  const profileHref = user ? `/${user.username}` : '/login'
  const router = useRouter()
  const { data: unreadCount } = useUnreadNotificationCount()

  return (
    <div className="h-screen w-68 bg-right-bar text-white flex flex-col justify-between py-5 ml-16">
      {/* TOP SECTION */}
      <div className="px-4">
        {/* LOGO */}
        <div className="flex items-center gap-0 mb-5">
          <div className="relative h-10 w-10">
            <Image
              src="/logo.png"
              alt="BeBu Logo"
              fill // Menggunakan fill agar mengikuti ukuran container div-nya
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-logo-gradient bg-clip-text text-transparent">
            BeBu
          </span>
        </div>

        {/* SEARCH */}
        <motion.div
          layoutId="search-bar-container"
          onClick={() => router.push('/search')}
          className="relative group cursor-pointer my-2"
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-blue-400 transition-colors"
            size={18}
          />
          <div className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-500">
            Search...
          </div>
        </motion.div>

        {/* NAVIGATION */}
        <div className="flex flex-col gap-2">
          <SidebarItem icon={<Home size={20} />} label="Home" href="/" />
          <SidebarItem
            icon={<User size={20} />}
            label="My Profile"
            href={profileHref}
          />
          <SidebarItem
            icon={<Library size={20} />}
            label="List Bookshelf"
            href={`/bookshelf/${user?.username}`}
          />
          <SidebarItem
            icon={<Book size={20} />}
            label="List Book"
            href="/books"
          />
          <SidebarItem
            icon={<MessageCircle size={20} />}
            label="Chat"
            href="/chat"
          />
          <SidebarItem
            icon={
              <div className="relative">
                <Bell size={20} />
                {unreadCount && unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#0B1220]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </div>
            }
            label="Notification"
            href="/notifications"
          />

          {/* ADMIN ONLY */}
          {user?.role === 'admin' && (
            <>
              <div className="mt-4 text-[10px] tracking-widest text-gray-500">
                ADMIN
              </div>
              <SidebarItem
                icon={<Shield size={20} />}
                label="Book Management"
                href="/admin/books"
              />
              <SidebarItem
                icon={<Flag size={20} />}
                label="Report Management"
                href="/admin/reports"
              />
            </>
          )}
        </div>
      </div>

      {/* 🔥 BOTTOM SECTION (FULL WIDTH + PREMIUM DIVIDER) */}
      <div className="relative mt-4">
        {/* ✨ Premium Divider */}
        <div className="relative">
          {/* main gradient line */}
          <div className="h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent" />

          {/* subtle glow */}
          <div className="absolute inset-0 h-px w-full blur-sm bg-white/20 opacity-60" />
        </div>

        {/* 🔥 Depth shadow (lebih rapat & halus) */}
        <div className="absolute left-0 right-0 h-4 bg-linear-to-b from-black/30 to-transparent pointer-events-none" />

        {/* User Profile */}
        <div className="px-4">
          <UserProfile user={user} />
        </div>
      </div>
    </div>
  )
}
