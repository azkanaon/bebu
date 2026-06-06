'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import FollowModal from './FollowModal'
import {
  ProfileInfo,
  ProfileStats,
  SocialLink,
  UserProfileResponse,
  ViewerContext,
  UserSetting,
} from '@/types/profile'
import { FaCheck } from 'react-icons/fa'
import { socialIconMap } from '@/lib/social-icon-map'
import { useFollowUser } from '@/api/profile/useFollowUser'
import { useQueryClient } from '@tanstack/react-query'
import { useUnfollowUser } from '@/api/profile/useUnfollowUser'
import { Ban, Flag, MoreVertical, UserPlus2 } from 'lucide-react'
import FollowRequestModal from './FollowRequestModal'
import { useFollowRequests } from '@/api/profile/useFollowRequest'
import EditProfileModal from './EditProfileModal'
import { useBlockUser, useUnblockUser } from '@/api/profile/useBlockUser'
import BlockConfirmModal from './BlockConfirmationModal'
import UserAvatar from '@/components/UserAvatar'
import ReportModal from '../feed/ReportModal'

type Props = {
  userId: number
  publicId: string
  username: string
  profile: ProfileInfo
  stats: ProfileStats
  socialLinks: SocialLink[]
  viewerContext?: ViewerContext
  isPrivateAccount: boolean
  settings?: UserSetting
}

export default function ProfileHeader({
  userId,
  username,
  profile,
  stats,
  socialLinks,
  viewerContext,
  isPrivateAccount,
  settings,
}: Props) {
  const [showOptions, setShowOptions] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [openReportModal, setOpenReportModal] = useState(false)

  const optionsRef = useRef<HTMLDivElement>(null)

  const { mutate: blockUser, isPending: isBlocking } = useBlockUser()
  const { mutate: unblockUser } = useUnblockUser()

  // Klik di luar untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(e.target as Node)
      ) {
        setShowOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBlockAction = () => {
    if (viewerContext?.isBlockedByYou) {
      unblockUser(username)
    } else {
      blockUser(username)
    }
    setShowBlockConfirm(false)
    setShowOptions(false)
  }

  const [openFollowModal, setOpenFollowModal] = useState(false)
  const [openRequestModal, setOpenRequestModal] = useState(false)
  const [openUpdateModal, setOpenUpdateModal] = useState(false)
  const [initialTab, setInitialTab] = useState<'followers' | 'following'>(
    'followers',
  )
  const { data: followRequestsData } = useFollowRequests()
  const { mutate: followUser, isPending } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()
  const queryClient = useQueryClient()

  const handleToggleFollow = () => {
    const isFollowing = viewerContext?.isFollowing
    const isRequested = viewerContext?.isPending

    if (isFollowing || isRequested) {
      unfollowUser(username, {
        onSuccess: () => {
          queryClient.setQueryData(
            ['profile', username],
            (oldData: UserProfileResponse | undefined) => {
              if (!oldData) return oldData
              return {
                ...oldData,
                stats: {
                  ...oldData.stats,
                  totalFollowers: oldData.viewerContext?.isFollowing
                    ? Math.max(oldData.stats.totalFollowers - 1, 0)
                    : oldData.stats.totalFollowers,
                },
                viewerContext: oldData.viewerContext
                  ? {
                      ...oldData.viewerContext,
                      isFollowing: false,
                      isPending: false,
                    }
                  : undefined,
              }
            },
          )
          queryClient.invalidateQueries({
            queryKey: ['followers', username],
          })
        },
      })
      return
    }

    followUser(username, {
      onSuccess: (response) => {
        queryClient.setQueryData(
          ['profile', username],
          (oldData: UserProfileResponse | undefined) => {
            if (!oldData) return oldData
            return {
              ...oldData,
              stats: {
                ...oldData.stats,
                totalFollowers:
                  response.status === 'accepted'
                    ? oldData.stats.totalFollowers + 1
                    : oldData.stats.totalFollowers,
              },
              viewerContext: oldData.viewerContext
                ? {
                    ...oldData.viewerContext,
                    isFollowing: response.status === 'accepted',
                    isPending: response.status === 'pending',
                  }
                : undefined,
            }
          },
        )
        if (response.status === 'accepted') {
          queryClient.invalidateQueries({
            queryKey: ['followers', username],
          })
        }
      },
    })
  }

  const totalFollowRequests = followRequestsData?.pages[0].meta.totalItems ?? 0

  return (
    <div>
      <div className="bg-[#0B1220] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 relative">
        {viewerContext && !viewerContext?.isOwnProfile && (
          <div
            className="absolute top-4 right-4 md:top-2 md:right-2 z-30"
            ref={optionsRef}
          >
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <MoreVertical size={20} />
            </button>

            {/* TOOLTIP / DROPDOWN */}
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                    y: -10,
                  }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-[#0B1220] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1"
                >
                  <button
                    onClick={() =>
                      viewerContext?.isBlockedByYou
                        ? handleBlockAction()
                        : setShowBlockConfirm(true)
                    }
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer"
                  >
                    <Ban size={16} />
                    {viewerContext?.isBlockedByYou
                      ? 'Unblock User'
                      : 'Block User'}
                  </button>
                  <button
                    onClick={() => {
                      setOpenReportModal(true)
                      setShowOptions(false)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-white/5 text-gray-400 transition-colors cursor-pointer"
                  >
                    <Flag size={16} />
                    Report
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {/* Avatar */}
        <div className="flex justify-center sm:justify-start">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden">
            <UserAvatar
              user={{
                avatar_url: profile.avatarUrl,
              }}
              size={96}
              className="border-2 border-white/50"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 ">
          {/* Top */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-white">
                {profile?.displayName}
              </h1>
              <p className="text-sm text-gray-400">@{username}</p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm text-gray-300">
              {viewerContext?.isOwnProfile && isPrivateAccount && (
                <button
                  onClick={() => setOpenRequestModal(true)}
                  className="relative w-8 h-8 rounded-full border border-white/10 bg-white/3 flex items-center justify-center hover:bg-white/6 transition-all text-gray-300 hover:text-white ease-out cursor-pointer scale-100 hover:scale-103"
                >
                  <UserPlus2 size={18} />

                  {totalFollowRequests > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold border border-[#0B1220]"
                    >
                      {totalFollowRequests}
                    </motion.span>
                  )}
                </button>
              )}
              <motion.button
                whileHover={{
                  scale: 1.03,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                className="px-3 py-1.5 rounded-xl cursor-pointer"
                onClick={() => {
                  setInitialTab('followers')
                  setOpenFollowModal(true)
                }}
              >
                <motion.span
                  whileHover={{
                    color: '#ffffff',
                    textShadow: '0px 0px 8px rgba(255,255,255,0.8)',
                  }}
                  className="flex gap-1"
                >
                  <span className="font-bold">{stats?.totalFollowers}</span>
                  <span>Followers</span>
                </motion.span>
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.03,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                className="pl-3 pr-5 py-1.5 rounded-xl cursor-pointer"
                onClick={() => {
                  setInitialTab('following')
                  setOpenFollowModal(true)
                }}
              >
                <motion.span
                  whileHover={{
                    color: '#ffffff',
                    textShadow: '0px 0px 8px rgba(255,255,255,0.8)',
                  }}
                  className="flex gap-1"
                >
                  <span className="font-bold">{stats?.totalFollowing}</span>
                  <span>Following</span>
                </motion.span>
              </motion.button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {viewerContext?.isOwnProfile ? (
              <button
                onClick={() => setOpenUpdateModal(true)}
                className="px-4 py-1.5 rounded-xl text-sm sm:font-medium w-full sm:w-auto bg-blue-900 text-white/70 hover:bg-blue-900/80 border border-blue-950  transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            ) : (
              !viewerContext?.isBlockedByYou && (
                <button
                  className="border bg-white/90 text-brand-dark font-bold border-white/20 px-4 py-1.5 rounded-full text-sm w-full sm:w-auto cursor-pointer hover:bg-brand-dark hover:text-white/90 transition-colors"
                  onClick={handleToggleFollow}
                  disabled={isPending}
                >
                  {viewerContext?.isFollowing ? (
                    <span className="flex justify-center items-center gap-2">
                      <FaCheck size={12} /> Following
                    </span>
                  ) : viewerContext?.isPending ? (
                    'Requested'
                  ) : isPending ? (
                    'Loading...'
                  ) : (
                    'Follow'
                  )}
                </button>
              )
            )}
          </div>

          {/* Bio */}
          <div className="flex flex-col md:flex-row gap-2 sm:justify-between">
            <div className="flex  mt-3 md:max-w-3/5 items-start">
              <p className="text-sm text-gray-400 font-medium">
                {profile.bio != '' ? profile.bio : 'Not create bio yet'}
              </p>
            </div>
            <div className="flex flex-wrap md:justify-end md:items-end md:w-2/5 gap-2">
              {socialLinks.map((social, index) => {
                const Icon = socialIconMap[social.platformSlug]

                if (!Icon) return null

                return (
                  <div className="relative group" key={index}>
                    {/* Tooltip */}
                    <div className="absolute -bottom-6 -right-1/2 px-2 py-1 text-xs rounded bg-black text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                      {social.platformName}
                    </div>
                    <motion.a
                      whileHover={{ scale: 1.08, y: -3 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 18,
                      }}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative w-9 h-9 rounded-full bg-white/3 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white overflow-hidden"
                    >
                      {/* Glow Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10" />

                      <Icon
                        size={18}
                        className="shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110"
                      />
                    </motion.a>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <BlockConfirmModal
        open={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={handleBlockAction}
        username={username}
        isPending={isBlocking}
      />

      <ReportModal
        isOpen={openReportModal}
        onClose={() => setOpenReportModal(false)}
        entityId={userId}
        entityType="user"
      />

      <FollowModal
        open={openFollowModal}
        onClose={() => setOpenFollowModal(false)}
        initialTab={initialTab}
        username={username}
      />
      <FollowRequestModal
        open={openRequestModal}
        onClose={() => setOpenRequestModal(false)}
      />
      <EditProfileModal
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        initialData={{
          username,
          profile,
          socialLinks,
          isPrivateAccount,
          settings,
        }}
      />
    </div>
  )
}
