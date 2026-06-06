import { Metadata } from 'next'
import MySubmissionsPage from './MySubmissionsPage'

export const metadata: Metadata = {
  title: 'My Submissions',
  description: 'Manage your book contribution requests',
}

export default function Page() {
  return <MySubmissionsPage />
}
