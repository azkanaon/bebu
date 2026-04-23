import React from 'react'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex h-screen w-full flex-col lg:flex-row bg-[#05070a] text-white">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('images/bg_desktop.png')" }}
      />
      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        {/* Sisi Kiri / Atas: Branding */}
        <div className="relative flex w-full flex-col items-center justify-center py-12 lg:pr-24 lg:items-end lg:w-1/2 lg:py-0 ">
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <div className="mb-4 flex items-center gap-3 lg:gap-0">
              <div className="relative h-12 w-12 lg:h-20 lg:w-20">
                <Image
                  src="/Logo.png"
                  alt="BeBu Logo"
                  width={80}
                  height={80}
                  className="object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight lg:text-5xl bg-logo-gradient bg-clip-text text-transparent">
                BeBu
              </h1>
            </div>
            <h2 className="mb-2 text-3xl font-semibold lg:text-4xl text-white/90">
              Welcome to BeBu
            </h2>
            <p className="max-w-70 text-sm text-gray-400 lg:max-w-none lg:text-base">
              Discuss and explore books with others
            </p>
          </div>
        </div>

        {/* Sisi Kanan: Form Container */}
        <div className="flex w-full items-start justify-center px-4 pb-20 lg:w-1/2 lg:items-center lg:justify-start lg:pl-20 xl:pl-24 lg:pb-0">
          <div className="w-full max-w-110 lg:h-screen lg:flex lg:flex-col lg:justify-center">
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}
