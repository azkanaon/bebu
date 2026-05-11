import api from '@/lib/axios'
import { FollowListResponse, FollowResponse } from '@/types/follow'
import { FollowRequestResponse } from '@/types/follow-request'
import {
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserProfileResponse,
} from '@/types/profile'

export const profileService = {
  getProfile: async (username: string): Promise<UserProfileResponse> => {
    const response = await api.get<{ data: UserProfileResponse }>(
      `/v1/users/${username}`,
    )

    return response.data.data
  },

  followUser: async (username: string): Promise<FollowResponse> => {
    const response = await api.post<FollowResponse>(
      `/v1/users/${username}/follow`,
    )
    return response.data
  },

  unfollowUser: async (username: string): Promise<void> => {
    await api.delete(`/v1/users/${username}/follow`)
  },

  getFollowRequests: async (page: number): Promise<FollowRequestResponse> => {
    const response = await api.get<FollowRequestResponse>(
      `/v1/follow-requests?page=${page}`,
    )
    return response.data
  },

  acceptFollowRequest: async (username: string): Promise<void> => {
    await api.post(`/v1/follow-requests/${username}/accept`)
  },

  declineFollowRequest: async (username: string): Promise<void> => {
    await api.delete(`/v1/follow-requests/${username}/decline`)
  },

  getFollowers: async (
    username: string,
    page: number,
  ): Promise<FollowListResponse> => {
    // Tambahkan query parameter page
    const response = await api.get<FollowListResponse>(
      `/v1/users/${username}/followers?page=${page}`,
    )
    return response.data
  },

  getFollowing: async (
    username: string,
    page: number,
  ): Promise<FollowListResponse> => {
    const response = await api.get<FollowListResponse>(
      `/v1/users/${username}/following?page=${page}`,
    )
    return response.data
  },

  updateProfile: async (payload: FormData): Promise<UpdateProfileResponse> => {
    const response = await api.put<UpdateProfileResponse>(
      '/v1/users/me/profile',
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return response.data
  },
}
