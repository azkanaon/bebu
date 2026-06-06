import { Metadata } from 'next'
import ProfileClient from './ProfileClient'

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  return {
    title: `${username}'s Profile`, // Hasil: "nanang's Profile | Bebu"
  }
}

export default async function Page({ params }: Props) {
  return <ProfileClient params={params} />
}
