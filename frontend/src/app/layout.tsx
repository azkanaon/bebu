import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import TanstackProvider from '@/components/TanstackProvider'
import './globals.css'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Bebu',
    template: '%s | Bebu',
  },
  description: 'Book Discussion Platform for Everyone',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TanstackProvider>
          {children}
          <Toaster position="top-center" richColors duration={1000} />
        </TanstackProvider>
      </body>
    </html>
  )
}
