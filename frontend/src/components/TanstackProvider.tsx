'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ReactNode, useState } from 'react'
import NotificationHandler from './NotificationHandler'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false, // 5 menit
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationHandler /> {children}
    </QueryClientProvider>
  )
}
