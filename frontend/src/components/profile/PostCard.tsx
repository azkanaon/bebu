'use client'

import { PostType, UserPost } from '@/types/user-posts'
import { Heart, MessageSquare, Star, Bookmark } from 'lucide-react'
import Link from 'next/link'
import BookCover from '@/components/BookCover'
import UserAvatar from '@/components/UserAvatar'

interface PostCardProps {
  post: UserPost
  viewType: PostType
}

export default function PostCard({ post, viewType }: PostCardProps) {
  const isReview = viewType === 'review'

  // --- MODE REVIEW (Grid) ---
  if (isReview) {
    return (
      <Link href={`/post/${post.publicId}`} className="group block h-full">
        <div className="bg-[#0B1220]/80 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:border-blue-500/30 hover:bg-[#0D1525]">
          {/* IMAGE CONTAINER */}
          <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden">
            <BookCover
              src={post.book.coverImgUrl}
              title={post.book.title}
              fill
              className="transition-transform duration-500 group-hover:scale-105"
            />

            {/* RATING */}
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10 flex items-center gap-1.5">
              <Star size={10} fill="#fbbf24" className="text-amber-400" />
              <span className="text-[10px] font-bold text-white">
                {post.rating}
              </span>
            </div>
          </div>

          {/* INFO */}
          <div className="p-4 flex flex-col flex-1">
            <h4 className="text-xs font-semibold text-slate-200 leading-snug line-clamp-2 transition-colors group-hover:text-blue-400">
              {post.book.title}
            </h4>

            <div className="mt-auto pt-4 flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Heart
                  size={14}
                  className={post.is_liked ? 'text-pink-500' : 'text-slate-600'}
                  fill={post.is_liked ? 'currentColor' : 'none'}
                />
                <span className="text-[10px] font-bold">
                  {post.stats.likeCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare size={14} className="text-slate-600" />
                <span className="text-[10px] font-bold">
                  {post.stats.commentCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // --- MODE ANALYSIS (List/Feed) ---
  return (
    <Link href={`/post/${post.publicId}`} className="group block">
      <div className="bg-[#0B1220]/40 border border-white/5 rounded-[2rem] p-6 transition-all duration-300 hover:bg-white/[0.02] hover:border-white/10">
        <div className="flex items-center gap-4 mb-4">
          {/* CONTAINER KOMBINASI BUKU + USER */}
          <div className="relative shrink-0 w-12 h-16">
            {' '}
            {/* Ukuran container diperbesar dikit */}
            {/* 1. GAMBAR BUKU (Lapisan Bawah) */}
            <div className="relative w-10 h-14 rounded-lg overflow-hidden border border-white/10 bg-slate-800 transition-colors group-hover:border-blue-500/20 shadow-lg">
              <BookCover
                src={post.book.coverImgUrl}
                title={post.book.title}
                fill
              />
            </div>
            {/* 2. AVATAR USER (Lapisan Atas / Overlay) */}
            <UserAvatar
              user={{
                avatar_url: post.user?.avatarUrl,
                display_name: post.user?.displayName,
              }}
              size={24}
              className="absolute -bottom-0 -right-0 border-2 border-[#0B1220] z-20 shadow-xl"
            />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate transition-colors group-hover:text-blue-400">
              {post.book.title}
            </h4>

            {/* Info User & Tanggal */}
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              <span className="text-slate-300 font-bold group-hover:text-blue-300 transition-colors">
                {post.user?.displayName || 'Anonymous'}
              </span>
              <span className="mx-1.5 opacity-30">•</span>
              {new Date(post.publishedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-6 font-medium">
          {post.description}
        </p>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Heart
              size={16}
              className={post.is_liked ? 'text-pink-500' : 'text-slate-500'}
              fill={post.is_liked ? 'currentColor' : 'none'}
            />
            <span className="text-[11px] font-bold text-slate-500">
              {post.stats.likeCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-slate-500" />
            <span className="text-[11px] font-bold text-slate-500">
              {post.stats.commentCount}
            </span>
          </div>

          <div className="ml-auto">
            <Bookmark
              size={16}
              className={post.is_saved ? 'text-blue-500' : 'text-slate-500'}
              fill={post.is_saved ? 'currentColor' : 'none'}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
