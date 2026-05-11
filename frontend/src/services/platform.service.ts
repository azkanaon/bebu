import api from '@/lib/axios'
import { Platform } from '@/types/platform'

export const platformService = {
  getPlatforms: async (): Promise<Platform[]> => {
    const response = await api.get<{
      data: Platform[]
    }>('/v1/platforms')

    return response.data.data
  },
}
