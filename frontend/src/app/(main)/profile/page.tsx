'use client'

import { motion } from 'framer-motion'
import ProfileHeader from '@/components/profile/ProfileHeader'
import Achievements from '@/components/profile/Achievements'
import Badges from '@/components/profile/Badges'
import ActivityTracking from '@/components/profile/ActivityTracking'
import PostTabs from '@/components/profile/PostTabs'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const item = {
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

export default function ProfilePage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 py-4"
    >
      <motion.div variants={item}>
        <ProfileHeader />
      </motion.div>

      <motion.div variants={item}>
        <Achievements />
      </motion.div>

      <motion.div variants={item}>
        <Badges />
      </motion.div>

      <motion.div variants={item}>
        <ActivityTracking />
      </motion.div>

      <motion.div variants={item}>
        <PostTabs />
      </motion.div>
    </motion.div>
  )
}
