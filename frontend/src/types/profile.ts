export interface UserProfileResponse {
  publicId: string
  username: string
  profile: ProfileInfo
  stats: ProfileStats
  socialLinks: SocialLink[]
  badges: Badge[]
  achievements: Achievement[]
  viewerContext: ViewerContext
  isPrivate: boolean
}

export interface ProfileInfo {
  displayName: string
  avatarUrl: string
  bio: string
  location: string
  gender: string
  joinedAt: string
}

export interface ProfileStats {
  postCount: number
  followerCount: number
  followingCount: number
}

export interface SocialLink {
  platformName: string
  platformImageUrl: string
  url: string
}

export interface Badge {
  badgeName: string
  logoUrl: string
  description: string
}

export interface Achievement {
  achievementName: string
  logoUrl: string
  description: string
  earnedAt: string
}

export interface ViewerContext {
  isFollowing: boolean
  isPending: boolean
  isBlocked: boolean
  isBlockedByYou: boolean
  isOwnProfile: boolean
}
