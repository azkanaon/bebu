'use client'

import { SearchBook, SearchUser } from '@/types/search'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Users,
  BookMarked,
  MessageSquare,
  Star,
} from 'lucide-react'
import Image from 'next/image'

// DATA DUMMY
const DUMMY_PEOPLE: SearchUser[] = [
  {
    id: 1,
    username: 'nando_dev',
    displayName: 'Nando Si Kalem',
    avatarUrl: 'https://i.pravatar.cc/150?u=1',
    isFollowing: false,
  },
  {
    id: 2,
    username: 'desi_pro',
    displayName: 'Dezzii',
    avatarUrl: 'https://i.pravatar.cc/150?u=2',
    isFollowing: true,
  },
  {
    id: 3,
    username: 'budi_read',
    displayName: 'Budi Pembaca',
    avatarUrl: 'https://i.pravatar.cc/150?u=3',
    isFollowing: false,
  },
]

const DUMMY_BOOKS: SearchBook[] = [
  {
    id: 101,
    title: 'Atomic Habits',
    author: 'James Clear',
    coverUrl:
      'https://m.media-amazon.com/images/I/5-xx45tMDKL._SY344_BO1,204,203,200_.jpg',
    rating: 4.8,
  },
  {
    id: 102,
    title: 'Deep Work',
    author: 'Cal Newport',
    coverUrl:
      'https://m.media-amazon.com/images/I/417P3369u9L._SX331_BO1,204,203,200_.jpg',
    rating: 4.5,
  },
]

export default function TopResults({
  onSeeAll,
}: {
  onSeeAll: (tab: string) => void
}) {
  return (
    <div className="space-y-10">
      {/* SECTION: PEOPLE (Horizontal Carousel) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Users size={18} className="text-blue-400" /> People
          </h3>
          <button
            onClick={() => onSeeAll('people')}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            See All <ArrowRight size={12} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {DUMMY_PEOPLE.map((user) => (
            <motion.div
              key={user.id}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 w-32 bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center gap-2"
            >
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/20">
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 w-full">
                <p className="text-[11px] font-bold text-white truncate">
                  {user.displayName}
                </p>
                <p className="text-[9px] text-slate-500 truncate">
                  @{user.username}
                </p>
              </div>
              <button
                className={`mt-1 px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${user.isFollowing ? 'bg-white/10 text-slate-400' : 'bg-blue-600 text-white'}`}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION: BOOKS (Grid 2 Kolom) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BookMarked size={18} className="text-amber-400" /> Books
          </h3>
          <button
            onClick={() => onSeeAll('books')}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            See All <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {DUMMY_BOOKS.map((book) => (
            <div
              key={book.id}
              className="bg-white/5 border border-white/5 p-3 rounded-2xl flex gap-3 group cursor-pointer hover:border-amber-500/20 transition-all"
            >
              <div className="relative w-16 h-22 rounded-lg overflow-hidden shrink-0 shadow-lg">
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                  {book.title}
                </p>
                <p className="text-[10px] text-slate-500 truncate mb-2">
                  {book.author}
                </p>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={10} fill="currentColor" />
                  <span className="text-[10px] font-bold text-slate-300">
                    {book.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: POSTS (Vertical List) */}
      <section className="space-y-4 pb-10">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-400" /> Recent
            Discussions
          </h3>
          <button
            onClick={() => onSeeAll('posts')}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            See All <ArrowRight size={12} />
          </button>
        </div>

        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-700" />
                <p className="text-[10px] font-bold text-white">
                  User_Anonymous_{i}
                </p>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                This book completely changed how I view daily habits. The
                concept of 1% improvement every day is mind-blowing...
              </p>
              <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                <span>❤️ 12 Likes</span>
                <span>💬 4 Comments</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
