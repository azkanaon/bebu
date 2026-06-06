'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Loader2, Newspaper, LayoutGrid, AlignLeft } from 'lucide-react'
import PostCard from './PostCard'
import BookshelfShowcase from './BookshelfShowCase'
import { PostType } from '@/types/post'
import {
  useInfiniteUserPosts,
  useInfiniteUserLikes,
  useInfiniteUserSaves,
} from '@/api/post/useUserPosts'

const tabs = ['Posts', 'Liked', 'Saved', 'Bookshelf']

export default function PostTabs({ username }: { username: string }) {
  const [activeTab, setActiveTab] = useState('Posts')
  const [postType, setPostType] = useState<PostType>('review')

  const postsQuery = useInfiniteUserPosts(username)
  const likesQuery = useInfiniteUserLikes(username)
  const savesQuery = useInfiniteUserSaves(username)

  const currentQuery =
    activeTab === 'Posts'
      ? postsQuery
      : activeTab === 'Liked'
        ? likesQuery
        : savesQuery
  console.log(currentQuery?.data)

  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && currentQuery.hasNextPage) currentQuery.fetchNextPage()
  }, [inView, currentQuery, activeTab])

  const filteredPosts = useMemo(() => {
    const all = currentQuery.data?.pages.flatMap((p) => p.data) || []
    return all.filter((post) => post.postType === postType)
  }, [currentQuery.data, postType])

  return (
    <div className="w-full">
      {/* 1. HEADER TAB UTAMA */}
      <div className="flex border-b border-white/10 mb-6 relative px-1">
        {tabs.map((tab) => (
          <TabButton
            key={tab}
            label={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      {/* CONTENT AREA */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'Bookshelf' ? (
            <BookshelfShowcase username={username} />
          ) : (
            <div className="space-y-6">
              {/* 2. SUB-TAB SWITCHER (Diletakkan di bawah Tab Utama) */}
              <div className="flex justify-center sm:justify-start">
                <div className="relative flex bg-slate-900/80 border border-white/10 rounded-xl p-1">
                  <motion.div
                    layoutId="post-type-switcher"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                    className={`absolute top-1 bottom-1 rounded-lg bg-blue-600 ${
                      postType === 'review' ? 'left-1 w-30' : 'left-30.25 w-30'
                    }`}
                  />

                  <button
                    onClick={() => setPostType('review')}
                    className={`relative z-10 flex items-center gap-2 px-5 py-1 text-sm transition-colors cursor-pointer ${
                      postType === 'review' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <LayoutGrid size={16} />
                    Reviews
                  </button>

                  <button
                    onClick={() => setPostType('analysis')}
                    className={`relative z-10 flex items-center gap-2 px-5 py-1 text-sm transition-colors cursor-pointer ${
                      postType === 'analysis' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <AlignLeft size={16} />
                    Analysis
                  </button>
                </div>
              </div>

              {/* 3. LIST POSTINGAN */}
              <div key={postType}>
                {currentQuery.isLoading ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-blue-500" />
                  </div>
                ) : filteredPosts.length > 0 ? (
                  <div
                    className={
                      postType === 'review'
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                        : 'flex flex-col gap-4 max-w-2xl mx-auto'
                    }
                  >
                    {filteredPosts.map((post) => (
                      <PostCard
                        key={post.publicId}
                        post={post}
                        viewType={postType}
                      />
                    ))}

                    <div
                      ref={ref}
                      className="col-span-full py-10 flex justify-center"
                    >
                      {currentQuery.isFetchingNextPage && (
                        <Loader2 className="animate-spin text-blue-500" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
                    <Newspaper size={40} className="opacity-10" />
                    <p className="text-sm italic font-medium">
                      No {postType}s shared here yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// --- SUB-COMPONENT: TAB BUTTON (UTAMA) ---
function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative px-5 py-3 text-sm font-medium transition-colors duration-300 outline-none cursor-pointer"
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            layoutId="hover-pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/5 rounded-xl z-0"
          />
        )}
      </AnimatePresence>
      <span
        className={`relative z-10 ${active ? 'text-white' : 'text-slate-500'}`}
      >
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="tab-underline"
          className="absolute left-2 right-2 -bottom-px h-0.5 bg-blue-500 rounded-full z-20"
        />
      )}
    </button>
  )
}
