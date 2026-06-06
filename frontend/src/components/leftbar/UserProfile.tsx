'use client'

import { MoreVertical, LogOut, Settings, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useLogout } from '@/api/auth/useLogout'
import { User as TypeUser } from '@/types/auth'
import UserAvatar from "@/components/UserAvatar";

type Props = {
  user: TypeUser | null
}

export function UserProfile({ user }: Props) {
  const [open, setOpen] = useState(false)
  const [expand, setExpand] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { mutate: logout, isPending } = useLogout()
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setExpand(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  //   const statusColor = {
  //     online: 'bg-green-500',
  //     idle: 'bg-yellow-400',
  //     offline: 'bg-gray-500',
  //   }[user.status || 'online']

  return (
    <div className="mt-4 relative">
      <div ref={ref} className="relative z-10">
        {/* PROFILE ROW */}
        <div
          className="group flex items-center justify-between px-3 py-2 rounded-xl
          hover:bg-white/5
          transition-all duration-200
          hover:scale-[1.03]   /* ✅ hover scale */
          active:scale-[0.98]
          cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
        >
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar user={user} size={40} />

              {/* Presence */}
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500
                border-2 border-[#0B1120] rounded-full`}
              />
            </div>

            {/* Name */}
            <div className="leading-normal">
              <div className="text-sm font-semibold text-white">
                {user?.display_name}
              </div>
              <div className="text-xs text-gray-400">@{user?.username}</div>
            </div>
          </div>
        </div>

        {/* DROPDOWN */}
        {open && (
          <div
            className="absolute left-4 right-4 bottom-16 rounded-xl
            bg-[#0f172a]/95 backdrop-blur-xl
            border border-white/10
            shadow-2xl
            overflow-hidden
            animate-in fade-in zoom-in-95"
          >
            <button className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/10  cursor-pointer">
              <Settings size={16} />
              Settings
            </button>

            <div className="border-t border-white/10" />

            <button
              onClick={() => logout()}
              disabled={isPending}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 cursor-pointer ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <LogOut size={16} />
              {isPending ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
