import { useQuery } from '@tanstack/react-query'

import { platformService } from '@/services/platform.service'

export const usePlatforms = () => {
  return useQuery({
    queryKey: ['platforms'],

    queryFn: () => platformService.getPlatforms(),

    staleTime: Infinity,
  })
}
