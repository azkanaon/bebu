// app/auth/template.tsx
'use client'

import { motion } from 'framer-motion'

export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.div
      // Animasi masuk setiap kali pindah route
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
