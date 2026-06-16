'use client'

import { MessageSquareText } from 'lucide-react'
import ChatInboxList from '@/components/chat/ChatInboxList'

export default function ChatMainPage() {
  return (
    <div className="h-full w-full flex flex-col">
      {/* 
         1. TAMPILAN MOBILE: 
         Muncul hanya di layar < lg. 
         Berisi daftar chat karena di mobile aside-layout disembunyikan.
      */}
      <div className="lg:hidden h-full flex flex-col">
        <ChatInboxList />
      </div>

      {/* 
         2. TAMPILAN DESKTOP (PLACEHOLDER):
         Muncul hanya di layar >= lg.
         Ini akan mengisi sisi kanan layar saat belum ada chat yang dipilih.
      */}
      <div className="hidden lg:flex h-full flex-col items-center justify-center text-slate-500 gap-5 bg-[#070D18]/20">
        <div className="relative">
          {/* Lingkaran dekoratif di belakang icon */}
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-150" />
          <div className="relative w-24 h-24 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-600 shadow-2xl">
            <MessageSquareText
              size={48}
              strokeWidth={1.5}
              className="opacity-40"
            />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-white uppercase tracking-widest italic">
            Your Inbox
          </h2>
          <p className="text-xs text-slate-500 max-w-70 leading-relaxed">
            Select a conversation from the left to start sharing thoughts about
            your favorite books.
          </p>
        </div>

        {/* Info Tambahan Kecil (Optional) */}
        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            End-to-end Encrypted
          </span>
        </div>
      </div>
    </div>
  )
}
