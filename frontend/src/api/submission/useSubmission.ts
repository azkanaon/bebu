import {
  useInfiniteQuery,
  InfiniteData,
  useQueryClient,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { submissionService } from '@/services/submission.service'
import {
  BookSubmissionRequest,
  MySubmissionsResponse,
  SearchResultItem,
} from '@/types/submission'
import { toast } from 'sonner'

export const useInfiniteMySubmissions = (status: string = 'pending') => {
  return useInfiniteQuery<
    MySubmissionsResponse,
    Error,
    InfiniteData<MySubmissionsResponse>
  >({
    queryKey: ['my-submissions', status],
    queryFn: ({ pageParam = 1 }) =>
      submissionService.getMySubmissions(pageParam as number, status),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1
      }
      return undefined
    },
  })
}

export const useDeleteSubmission = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => submissionService.deleteSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] })
      toast.success('Request deleted successfully')
    },
  })
}

export const useSearchAuthors = (q: string) => {
  return useQuery<{ data: SearchResultItem[] }, Error>({
    queryKey: ['search-authors', q],
    queryFn: () => submissionService.searchAuthors(q),
    enabled: q.length > 0,
  })
}

export const useSearchGenres = (q: string) => {
  return useQuery<{ data: SearchResultItem[] }, Error>({
    queryKey: ['search-genres', q],
    queryFn: () => submissionService.searchGenres(q),
    enabled: q.length > 0,
  })
}

export const useSubmitBook = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BookSubmissionRequest) =>
      submissionService.submitBook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] })
      toast.success('Your request has been submitted!')
    },
    onError: () => toast.error('Failed to submit book request'),
  })
}
