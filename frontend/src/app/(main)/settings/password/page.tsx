import { Metadata } from 'next'
import ChangePasswordClient from './ChangePasswordClient'

export const metadata: Metadata = {
  title: 'Change Password',
  description: 'Secure your account by updating your password.',
}

export default function Page() {
  return <ChangePasswordClient />
}
