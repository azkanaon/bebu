// app/(main)/bookshelf/[username]/page.tsx
import { Metadata } from 'next'
import BookshelfClient from './BookshelfClient'

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username}'s Bookshelf`,
  }
}

export default async function Page({ params }: Props) {
  return <BookshelfClient params={params} />
}
