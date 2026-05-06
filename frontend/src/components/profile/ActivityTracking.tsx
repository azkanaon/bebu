'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

type Activity = {
  date: string
  likes: number
  comments: number
  posts: number
  notes: number
}

function generateYearData(year: number): Activity[] {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)

  const data: Activity[] = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    data.push({
      date: new Date(d).toISOString(),
      likes: Math.floor(Math.random() * 4),
      comments: Math.floor(Math.random() * 4),
      posts: Math.floor(Math.random() * 2),
      notes: Math.floor(Math.random() * 3),
    })
  }

  return data
}

function getIntensity(a: Activity) {
  const total = a.likes + a.comments + a.posts + a.notes

  if (total === 0) return 'bg-gray-800'
  if (total < 3) return 'bg-blue-900'
  if (total < 5) return 'bg-blue-700'
  if (total < 7) return 'bg-blue-500'
  return 'bg-blue-300'
}

export default function ActivityTracking() {
  const year = new Date().getFullYear()

  const [hovered, setHovered] = useState<Activity | null>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })

  const { weeks, monthLabels } = useMemo(() => {
    const data = generateYearData(year)
    const firstDay = new Date(year, 0, 1).getDay()
    const adjustedStart = firstDay
    const padded = [...Array(adjustedStart).fill(null), ...data]
    const weeks: (Activity | null)[][] = []
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7))
    }
    const monthLabels: { label: string; index: number }[] = []
    weeks.forEach((week, i) => {
      const firstValidDay = week.find((d) => d !== null)
      if (!firstValidDay) return
      const month = new Date(firstValidDay.date).getMonth()
      const prevMonth =
        i > 0
          ? new Date(
              weeks[i - 1].find((d) => d !== null)?.date || '',
            ).getMonth()
          : null
      if (month !== prevMonth) {
        monthLabels.push({
          label: new Date(firstValidDay.date).toLocaleString('default', {
            month: 'short',
          }),
          index: i,
        })
      }
    })
    return { weeks, monthLabels }
  }, [year])

  return (
    <div className="bg-[#0B1220] border border-white/10 rounded-xl p-4 relative">
      {/* HEADER */}
      <div className="flex justify-between mb-3">
        <h2 className="text-white font-semibold">Activity Tracking</h2>
      </div>

      <div className="overflow-x-auto custom-scrollbar-x pb-2">
        <div className="min-w-max">
          {/* MONTH LABEL */}
          <div className="relative h-4 mb-1 pl-8">
            {' '}
            {/* Memberi ruang untuk label hari */}
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute text-xs text-gray-400"
                style={{ left: `${m.index * 15 + 32}px` }} // Menggeser label bulan sesuai lebar label hari
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* PERBAIKAN: Kontainer baru untuk menyatukan label hari dan grid */}
          <div className="flex gap-2">
            {/* DAY LABEL */}
            {/* Dihapus 'pt-6' dan diganti dengan alignment dari flex parent */}
            <div className="flex flex-col text-xs text-gray-400 w-6 gap-0.75">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <div
                  key={i}
                  className="h-3 flex items-center justify-end" // Rata kanan agar rapi
                >
                  {d}
                </div>
              ))}
            </div>

            {/* GRID */}
            <div className="flex gap-0.75">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.75">
                  {week.map((day, di) => (
                    <motion.div
                      key={di}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: 0.01,
                        duration: 0.2,
                      }}
                      onMouseEnter={(e) => {
                        if (!day) return
                        setHovered(day)
                        setCursor({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseMove={(e) =>
                        setCursor({ x: e.clientX, y: e.clientY })
                      }
                      onMouseLeave={() => setHovered(null)}
                      whileHover={{ scale: 1.3 }}
                      className={`w-3 h-3 rounded-sm ${
                        day ? getIntensity(day) : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-3 text-xs text-gray-400 sticky">
        <span>Reading activity in the last 12 months</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="w-3 h-3 bg-gray-800 rounded-sm" />
          <div className="w-3 h-3 bg-blue-900 rounded-sm" />
          <div className="w-3 h-3 bg-blue-700 rounded-sm" />
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <div className="w-3 h-3 bg-blue-300 rounded-sm" />
          <span>More</span>
        </div>
      </div>

      {/* TOOLTIP FOLLOW CURSOR */}
      {hovered && (
        <div
          className="fixed z-50 bg-[#111827] text-xs text-white p-3 rounded-lg border border-white/10 shadow-lg pointer-events-none w-52"
          style={{
            top: cursor.y + 12,
            left: cursor.x + 12,
          }}
        >
          {(() => {
            const d = new Date(hovered.date)
            const total =
              hovered.likes + hovered.comments + hovered.posts + hovered.notes

            if (total === 0) {
              return (
                <p>
                  {d.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  tidak ada aktivitas
                </p>
              )
            }

            return (
              <div className="space-y-1">
                <p className="font-semibold">
                  {d.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <p>Menyukai {hovered.likes} postingan</p>
                <p>Mengomentari {hovered.comments} postingan</p>
                <p>Memposting {hovered.posts} postingan</p>
                <p>Menulis {hovered.notes} notes</p>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
