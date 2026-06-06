import { Metadata } from 'next'
import NotificationsClient from './NotificationClient'

export const metadata: Metadata = {
  title: 'Notifications', // Tab browser: "Notifications | Bebu"
}

export default function Page() {
  return <NotificationsClient />
}
