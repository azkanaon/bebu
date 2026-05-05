'use client'

import { useState } from 'react'

const badges = [
  { title: 'First Review', desc: 'Published your first review' },
  { title: 'Commenter', desc: 'Left 10 comments' },
  { title: 'Top Reviewer', desc: '100 likes' },
  { title: 'Avid Reader', desc: '50 books' },
  { title: 'Streak Master', desc: '7-day streak' },
  { title: 'Elite Reader', desc: '100 books' },
]

export default function Badges() {
  const [showAll, setShowAll] = useState(false)

  const displayed = showAll ? badges : badges.slice(0, 4)

  return (
    <div>
      <div className="flex justify-between mb-3">
        <h2 className="text-white font-semibold">Badges</h2>

        {badges.length > 4 && (
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
            <div className="h-12 mb-2 bg-white/10 rounded-full" />
            <p className="text-sm text-white">{item.title}</p>
            <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
