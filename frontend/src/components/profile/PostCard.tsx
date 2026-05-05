import Image from 'next/image'
import { motion } from 'framer-motion'

export default function PostCard() {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 250 }}
      className="bg-[#0B1220] border border-white/10 rounded-xl overflow-hidden cursor-pointer"
    >
      <div className="bg-[#0B1220] border border-white/10 rounded-xl overflow-hidden">
        <img
          src="https://picsum.photos/300/400"
          className="w-full h-56 sm:h-48 object-cover"
        />

        <div className="p-3">
          <h3 className="text-sm text-white font-medium">Sample Book Title</h3>

          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>❤️ 200</span>
            <span>💬 50</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
