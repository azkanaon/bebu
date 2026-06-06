// app/(main)/search/page.tsx
import { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
  title: 'Search',
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Search...</div>}>
      <SearchClient />
    </Suspense>
  )
}
