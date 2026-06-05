'use client'

import { motion, Variants } from 'framer-motion'
import ProfileHeader from '@/components/profile/ProfileHeader'
import Achievements from '@/components/profile/Achievements'
import Badges from '@/components/profile/Badges'
import PostTabs from '@/components/profile/PostTabs'
import { useProfile } from '@/api/profile/useProfile'
import { use } from 'react'

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

type Props = {
  params: Promise<{
    username: string
  }>
}

export default function ProfilePage({ params }: Props) {
  const { username } = use(params)

  const { data, isLoading, error } = useProfile(username)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error || !data) {
    return <div>Error</div>
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 py-4"
    >
      <motion.div variants={item}>
        <ProfileHeader
          userId={data.userId}
          publicId={data.publicId}
          username={data.username}
          profile={data.profile}
          stats={data.stats}
          socialLinks={data.socialLinks}
          viewerContext={data.viewerContext}
          settings={data.settings}
          isPrivateAccount={data.isPrivateAccount}
        />
      </motion.div>

      <motion.div variants={item}>
        <Achievements items={data.favoriteAchievements} username={username} />
      </motion.div>

      <motion.div variants={item}>
        <Badges items={data.favoriteBadges} username={username} />
      </motion.div>

      <motion.div variants={item}>
        <PostTabs username={username} />
      </motion.div>
    </motion.div>
  )
}
