import { searchService } from '@/services/search.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useSearchHistory = () => {
  return useQuery({
    queryKey: ['search-history'],
    queryFn: searchService.getHistory,
  })
}

export const useDeleteHistoryItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => searchService.deleteHistoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] })
    },
  })
}

export const useClearAllHistory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: searchService.clearAllHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] })
      toast.success('Search history cleared')
    },
  })
}
