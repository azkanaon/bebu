'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  }

  return (
    // PENTING: Gunakan h-screen dan overflow-hidden di sini
    <main className="relative h-screen w-full bg-[#05070a] text-white overflow-hidden">
      {/* BACKGROUND IMAGE ANIMATION */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('images/bg_desktop.png')" }}
      />

      {/* WRAPPER UTAMA */}
      <div className="relative z-10 flex h-full w-full flex-col lg:flex-row">
        {/* Sisi Kiri: Branding (Fixed height on mobile, full on desktop) */}
        <div className="flex w-full flex-col items-center justify-center py-10 lg:w-1/2 lg:items-end lg:pr-20 lg:py-0">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center px-6 lg:items-end lg:text-right"
          >
            <motion.div
              variants={itemVariants}
              className="mb-4 flex items-center gap-4 lg:flex-row-reverse"
            >
              <div className="relative h-12 w-12 lg:h-20 lg:w-20">
                <Image
                  src="/Logo.png"
                  alt="BeBu Logo"
                  width={80}
                  height={80}
                  className="object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                  priority
                />
              </div>
              <h1 className="text-4xl font-bold tracking-tighter lg:text-6xl bg-logo-gradient bg-clip-text text-transparent">
                BeBu
              </h1>
            </motion.div>

            <motion.h2
              variants={itemVariants}
              className="mb-2 text-2xl font-semibold lg:text-4xl text-white/90"
            >
              Welcome to BeBu
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="max-w-[280px] text-sm text-gray-400 lg:max-w-md lg:text-base"
            >
              Discuss and explore books with others
            </motion.p>
          </motion.div>
        </div>

        {/* Sisi Kanan: Form Container (Area ini yang bisa di-scroll jika form panjang) */}
        <div className="flex w-full flex-1 items-start justify-center px-6 lg:w-1/2 lg:items-center lg:justify-start lg:pl-20">
          <div className="w-full max-w-[420px] relative">{children}</div>
        </div>
      </div>
    </main>
  )
}
