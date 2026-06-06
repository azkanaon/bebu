import { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your account',
}

export default function Page() {
  return <LoginClient />
}
