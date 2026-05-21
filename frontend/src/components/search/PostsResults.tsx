'use client'

import { useInfiniteSearchPosts } from '@/api/search/useSearch'
import { useInView } from 'react-intersection-observer'
import { useEffect, useMemo } from 'react'
import { MessageSquare, Heart, Bookmark, Loader2 } from 'lucide-react'
import { LoadingSpinner } from './Loading'
import NoResults from './NoResults'

export default function PostsResults({ query }: { query: string }) {
  const { ref, inView } = useInView()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteSearchPosts(query)

  const allPosts = useMemo(
    () => data?.pages.flatMap((p) => p.data) || [],
    [data],
  )

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  if (isLoading) return <LoadingSpinner />

  if (!isLoading && allPosts.length === 0) {
    return <NoResults query={query} category="posts" />
  }

  return (
    <div className="space-y-4">
      {allPosts.map((post) => (
        <div
          key={post.publicId}
          className="bg-white/2 border border-white/10 p-5 rounded-[2rem] space-y-4 hover:bg-white/5 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
              {post.postType}
            </div>
            <span className="text-[10px] text-slate-600 font-medium">
              {new Date(post.publishedAt).toLocaleDateString()}
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">
            {post.description}
          </p>

          <div className="flex items-center gap-6 pt-2 border-t border-white/5">
            <StatItem
              icon={<Heart size={14} />}
              count={post.stats.likeCount}
              label="Likes"
            />
            <StatItem
              icon={<MessageSquare size={14} />}
              count={post.stats.commentCount}
              label="Comments"
            />
            <StatItem
              icon={<Bookmark size={14} />}
              count={post.stats.saveCount}
              label="Saves"
            />
          </div>
        </div>
      ))}
      <div ref={ref} className="py-10 flex justify-center">
        {isFetchingNextPage && (
          <Loader2 className="animate-spin text-blue-500" />
        )}
      </div>
    </div>
  )
}

function StatItem({
  icon,
  count,
  label,
}: {
  icon: React.ReactNode
  count: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-tighter">
        {count}
      </span>
    </div>
  )
}
