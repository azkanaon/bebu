'use client'

import { motion } from 'framer-motion'

export default function BookCard({
  item,
  onClick,
}: {
  item: any
  onClick: () => void
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="bg-[#0B1220] border border-white/10 rounded-xl overflow-hidden cursor-pointer"
    >
      <img src={item.book.coverImgUrl} className="w-full h-40 object-cover" />

      <div className="p-2">
        <p className="text-sm text-white line-clamp-2">{item.book.title}</p>

        {/* PROGRESS */}
        <div className="w-full bg-white/10 h-1.5 rounded mt-2 overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
}
