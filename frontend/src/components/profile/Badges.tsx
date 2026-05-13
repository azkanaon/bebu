'use client'

import { useState } from 'react'
import { FavoriteBadge } from '@/types/profile'
import Image from 'next/image'
import BadgesOverlay from './BadgesOverlay'

type Props = {
  items: FavoriteBadge[]
  username: string
}

export default function Badges({ items, username }: Props) {
  const [openBadges, setOpenBadges] = useState(false)

  const sortedItems = [...items].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
  )
  if (items.length === 0) return null
  return (
    <div>
      <div className="flex justify-between mb-3">
        <h2 className="text-white font-semibold tracking-wider">
          Favorite Badge
        </h2>

        <button
          onClick={() => setOpenBadges(!openBadges)}
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
                alt={item.badgeName}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-white">{item.badgeName}</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {item.description}
            </p>
          </div>
        ))}
      </div>
      <BadgesOverlay
        open={openBadges}
        onClose={() => setOpenBadges(false)}
        username={username}
        initialFavorites={items}
      />
    </div>
  )
}
