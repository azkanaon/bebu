'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/leftbar/Sidebar'
import RightSidebar from '@/components/rightbar/RightSidebar'
import CreatePostModal from '@/components/feed/CreatePostModal'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/stores/useAuthStore'

export default function Layout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const disableSidebarScroll = useRef(false)
  const [offset, setOffset] = useState(0)
  const [isResetting, setIsResetting] = useState(false)
  const { user } = useAuthStore()

  const [isAppLoading, setIsAppLoading] = useState(false)
  useEffect(() => {
    const handleLoadingEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      setIsAppLoading(customEvent.detail)
    }

    window.addEventListener('app-loading', handleLoadingEvent)
    return () => window.removeEventListener('app-loading', handleLoadingEvent)
  }, [])

  const lastScrollY = useRef(0)

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      const sidebar = document.getElementById('right-sidebar')

      if (!sidebar) return
      if (disableSidebarScroll.current) return
      if (isAppLoading) return

      const sidebarHeight = sidebar.offsetHeight
      const viewportHeight = window.innerHeight
      const currentScrollY = window.scrollY

      const padding = 16

      // Kalau sidebar lebih pendek dari viewport,
      // tidak perlu custom scrolling
      if (sidebarHeight + padding * 2 <= viewportHeight) {
        setOffset(0)
        lastScrollY.current = currentScrollY
        return
      }

      // Total maksimal scroll halaman
      const maxPageScroll =
        document.documentElement.scrollHeight - window.innerHeight

      // Sisa scroll menuju bawah halaman
      const remainingScroll = maxPageScroll - currentScrollY

      // Perubahan scroll user
      const delta = currentScrollY - lastScrollY.current

      // Maksimal sidebar boleh naik
      const maxScrollTop = sidebarHeight + padding - (viewportHeight - padding)

      setOffset((prev) => {
        let next = prev + delta

        // Minimum
        if (next < 0) {
          next = 0
        }

        // Maksimum normal sidebar
        if (next > maxScrollTop) {
          next = maxScrollTop
        }

        // Jangan melebihi sisa halaman
        if (next > remainingScroll) {
          next = remainingScroll
        }

        // Safety tambahan
        if (next < 0) {
          next = 0
        }

        return next
      })

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isAppLoading])

  useEffect(() => {
    let timer: NodeJS.Timeout

    disableSidebarScroll.current = true

    requestAnimationFrame(() => {
      setIsResetting(true)
      setOffset(0)

      timer = setTimeout(() => {
        setIsResetting(false)
        disableSidebarScroll.current = false
      }, 300)
    })

    return () => clearTimeout(timer)
  }, [currentTab])

  // RESET RIGHT SIDEBAR SAAT TAB BERPINDAH
  useEffect(() => {
    requestAnimationFrame(() => {
      setOffset(0)
    })
  }, [currentTab])

  if (!user) return <div>Loading...</div>

  return (
    <>
      <div className="flex justify-center gap-6 min-h-screen">
        {/* Background */}
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/images/bg_desktop.png')" }}
        />

        {/* Left Sidebar */}
        <aside className="w-84 hidden lg:block">
          <div className="sticky top-0 h-screen">
            <Sidebar user={user} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-[600px] z-0 px-3 sm:px-0">
          {children}
        </main>

        {/* Right Sidebar */}
        <aside className="w-84 hidden xl:block relative">
          <div
            id="right-sidebar"
            className="sticky top-4 h-fit" // Kunci agar tetap di viewport
            style={{
              transform: `translateY(-${offset}px)`,
              transition: isResetting
                ? 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)'
                : 'none',
            }}
          >
            <RightSidebar />
          </div>
        </aside>
      </div>

      {/* GLOBAL MODAL */}
      <CreatePostModal />

      {/* TOASTER */}
      <Toaster position="top-center" />
    </>
  )
}
