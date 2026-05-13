export interface UserProfileResponse {
  publicId: string
  username: string
  profile: ProfileInfo
  stats: ProfileStats
  socialLinks: SocialLink[]
  favoriteBadges: Badge[]
  favoriteAchievements: Achievement[]
  settings?: UserSetting
  viewerContext?: ViewerContext
  isPrivate: boolean
  isPrivateAccount: boolean
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
  totalFollowers: number
  totalFollowing: number
  totalPosts: number
  totalBadges: number
  totalAchievements: number
}

export interface SocialLink {
  platformName: string
  platformSlug: string
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

export interface UserSetting {
  isProfilePublic: boolean
  allowDmFromPublic: boolean
}

export interface SocialLinkInput {
  platformId: number // Menggunakan ID sesuai DTO Backend
  url: string
}

export interface UpdateProfileRequest {
  displayName?: string
  bio?: string
  location?: string
  gender?: string
  socialLinks?: SocialLinkInput[]
  isProfilePublic?: boolean
  allowDmFromPublic?: boolean
}

// Interface untuk response (biasanya mengembalikan data profile yang baru)
export interface UpdateProfileResponse {
  message: string
  data: any // Sesuaikan dengan response asli BE kamu
}

export interface FavoriteAchievement {
  achievementId: number
  achievementName: string
  logoUrl: string
  description: string
  earnedAt?: string
  displayOrder?: number
}

export interface FavoriteBadge {
  badgeId: number
  badgeName: string
  logoUrl: string
  description: string
  displayOrder?: number
}
