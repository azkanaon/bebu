'use client'

import { useInfiniteSearchUsers } from '@/api/search/useSearch'
import { useInView } from 'react-intersection-observer'
import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Loader2, User as UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from './Loading'
import NoResults from './NoResults'

export default function PeopleResults({ query }: { query: string }) {
  const router = useRouter()
  const { ref, inView } = useInView()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteSearchUsers(query)

  const allUsers = useMemo(
    () => data?.pages.flatMap((p) => p.data) || [],
    [data],
  )

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  if (isLoading) return <LoadingSpinner />

  if (!isLoading && allUsers.length === 0) {
    return <NoResults query={query} category="people" />
  }

  return (
    <div className="space-y-1">
      {allUsers.map((user) => (
        <div
          key={user.username}
          onClick={() => router.push(`/${user.username}`)}
          className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-white/10">
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
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-slate-500 truncate">
                @{user.username}
              </p>
              {user.viewerContext.isFollowing && (
                <span className="text-[10px] text-blue-400 font-medium">
                  Follows you
                </span>
              )}
            </div>
          </div>

          {!user.viewerContext.isOwnProfile && (
            <button
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${user.viewerContext.isFollowing ? 'bg-white/10 text-slate-400' : 'bg-blue-600 text-white'}`}
            >
              {user.viewerContext.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      ))}
      <div ref={ref} className="h-10 flex justify-center py-10">
        {isFetchingNextPage && (
          <Loader2 className="animate-spin text-blue-500" />
        )}
      </div>
    </div>
  )
}
