'use client'

import { TopSearchResponse } from '@/types/search'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Users,
  BookMarked,
  MessageSquare,
  Star,
  User as UserIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import NoResults from './NoResults'
import Link from 'next/link'

interface Props {
  data?: TopSearchResponse
  onSeeAll: (tab: string) => void
  query: string
}

export default function TopResults({ data, onSeeAll, query }: Props) {
  const router = useRouter()
  if (!data) return null
  const { users, books, posts } = data.data

  if (users.length === 0 && books.length === 0 && posts.length === 0) {
    return <NoResults query={query} />
  }

  return (
    <div className="space-y-10">
      {/* SECTION: PEOPLE (Horizontal Carousel) */}
      {users && users.length > 0 && (
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

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            {users.map((user) => (
              <motion.div
                key={user.username}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/${user.username}`)} // Navigasi ke profil
                className="shrink-0 w-32 bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center gap-2 cursor-pointer hover:border-white/20 transition-all"
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/20 bg-slate-800">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <UserIcon size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[11px] font-bold text-white truncate">
                    {user.displayName}
                  </p>
                  <p className="text-[9px] text-slate-500 truncate">
                    @{user.username}
                  </p>
                </div>
                {/* Tombol Follow (Hanya Tampilan) */}
                {!user.viewerContext.isOwnProfile && (
                  <button
                    onClick={(e) => e.stopPropagation()} // Stop agar tidak navigasi ke profil
                    className={`mt-1 w-full py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${user.viewerContext.isFollowing ? 'bg-white/10 text-slate-400' : 'bg-blue-600 text-white'}`}
                  >
                    {user.viewerContext.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: BOOKS (Grid 2 Kolom) */}
      {books && books.length > 0 && (
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
            {books.map((book) => (
              <Link
                href={`/books/${book.slug}`}
                key={book.public_id}
                className="bg-white/5 border border-white/10 p-3 rounded-2xl flex gap-3 group cursor-pointer hover:border-amber-500/20 transition-all"
              >
                <div className="relative w-16 h-22 rounded-lg overflow-hidden shrink-0 shadow-lg bg-slate-800">
                  {book.cover_img_url ? (
                    <Image
                      src={book.cover_img_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-600 uppercase text-center p-1">
                      No Cover
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                    {book.title}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mb-2">
                    {book.authors?.[0] || 'Unknown Author'}
                  </p>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={10} fill="currentColor" />
                    <span className="text-[10px] font-bold text-slate-300">
                      {book.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: POSTS (Vertical List - DATA ASLI) */}
      {posts && posts.length > 0 && (
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
            {posts.map((post) => (
              <div
                key={post.publicId}
                className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 hover:bg-white/8 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                    {post.postType}
                  </div>
                  <span className="text-[9px] text-slate-500">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center gap-4 text-[9px] text-slate-500 font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 hover:text-pink-500 transition-colors">
                    ❤️ {post.stats.likeCount} Likes
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                    💬 {post.stats.commentCount} Comments
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                    🔖 {post.stats.saveCount} Saved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
