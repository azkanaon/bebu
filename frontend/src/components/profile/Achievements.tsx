'use client'

import { useState } from 'react'

const achievements = [
  { title: 'Bookworm', score: '+100' },
  { title: 'Fantasy Enthusiast', score: '+50' },
  { title: 'Sci-Fi Scholar', score: '+50' },
  { title: 'Discussion Leader', score: '+50' },
  { title: 'Literary Explorer', score: '+25' },
  { title: 'More Coming', score: '+10' },
]

export default function Achievements() {
  const [showAll, setShowAll] = useState(false)

  const displayed = showAll ? achievements : achievements.slice(0, 4)

  return (
    <div>
      <div className="flex justify-between mb-3">
        <h2 className="text-white font-semibold">Achievements</h2>

        {achievements.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-400 text-sm"
          >
            {showAll ? 'Show less' : 'See all'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayed.map((item, i) => (
          <div
            key={i}
            className="bg-[#0B1220] border border-white/10 rounded-xl p-4 text-center"
          >
            <div className="h-12 mb-2 bg-white/10 rounded-lg" />
            <p className="text-sm text-white">{item.title}</p>
            <p className="text-blue-400 text-xs mt-1">{item.score}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
