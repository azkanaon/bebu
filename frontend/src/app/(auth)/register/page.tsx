import { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new account',
}

export default function Page() {
  return <RegisterClient />
}
