// src/providers/TanstackProvider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function TanstackProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Kita pakai useState agar QueryClient hanya dibuat satu kali (singleton)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Pengaturan opsional: kapan data dianggap basi
            staleTime: 60 * 1000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
