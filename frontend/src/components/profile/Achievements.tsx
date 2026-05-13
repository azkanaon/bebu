'use client'

import { useState } from 'react'
import { FavoriteAchievement } from '@/types/profile'
import Image from 'next/image'
import AchievementsOverlay from './AchievementOverlay'

type Props = {
  items: FavoriteAchievement[]
  username: string
}

export default function Achievements({ items, username }: Props) {
  const [openAchievements, setOpenAchievements] = useState(false)

  // Urutkan berdasarkan displayOrder (jika ada)
  const sortedItems = [...items].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
  )
  if (items.length === 0) return null

  return (
    <div>
      <div className="flex justify-between mb-3">
        <h2 className="text-white font-semibold tracking-wider">
          Favorite Achievements
        </h2>

        {/* Tombol Show All hanya muncul jika ada data (nanti dihubungkan ke API All Achievements) */}
        <button
          onClick={() => setOpenAchievements(true)}
          className="text-blue-400 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-blue-300 transition-colors"
        >
          Show All
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sortedItems.map((item, i) => (
          <div
            key={i}
            className="bg-[#0B1220] border border-white/10 rounded-xl p-4 text-center group hover:scale-105 hover:border-blue-500/50 transition-all"
          >
            <div className="relative h-12 w-12 mx-auto mb-3">
              <Image
                src={item.logoUrl}
                alt={item.achievementName}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-[11px] font-bold text-white uppercase tracking-tight line-clamp-1">
              {item.achievementName}
            </p>
            {/* Jika ada poin dari BE, tampilkan. Jika tidak, tampilkan deskripsi singkat */}
            <p className="text-blue-400 text-[10px] mt-1 font-mono uppercase">
              Earned
            </p>
          </div>
        ))}
      </div>

      <AchievementsOverlay
        open={openAchievements}
        onClose={() => setOpenAchievements(false)}
        username={username} // Pastikan username di-pass dari ProfilePage
      />
    </div>
  )
}
