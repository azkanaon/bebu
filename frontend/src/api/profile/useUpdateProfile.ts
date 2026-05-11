import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'
import { UpdateProfileResponse } from '@/types/profile'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/get-error-login-message'
import { useAuthStore } from '@/stores/useAuthStore'

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  // Tambahkan FormData sebagai generic ketiga <TData, TError, TVariables>
  return useMutation<UpdateProfileResponse, Error, FormData>({
    mutationFn: (formData: FormData) => profileService.updateProfile(formData),

    onSuccess: (response) => {
      toast.success('Profile updated!')
      const updateStore = useAuthStore.getState().setAuth
      const currentUser = useAuthStore.getState().user

      if (currentUser) {
        updateStore({
          ...currentUser,
          display_name: response.data.displayName, // sesuaikan dengan key response dari BE
          avatar_url: response.data.avatarUrl,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },

    onError: (error) => {
      const message = getErrorMessage(error)
      toast.error('Failed to update profile', {
        description: message,
      })
    },
  })
}
