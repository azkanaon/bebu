import { Metadata } from 'next'
import BooksClient from './BooksClient'

export const metadata: Metadata = {
  title: 'Books',
}

export default function Page() {
  return <BooksClient />
}
