'use client'

import { useState } from 'react'
import CollectionOverlay from './CollectionOverlay'

const achievements = [
  {
    id: 1,
    title: 'Minum Air Putih',
    description: 'Minum minimal 8 gelas air untuk menjaga hidrasi tubuh.',
    icon: 'water-drop',
    points: 10,
    category: 'Kesehatan',
  },
  {
    id: 2,
    title: 'Lari Pagi',
    description: 'Lari santai sejauh 3km di sekitar komplek perumahan.',
    icon: 'run',
    points: 50,
    category: 'Olahraga',
  },
  {
    id: 3,
    title: 'Membaca Buku',
    description: 'Baca minimal satu bab buku pengembangan diri.',
    icon: 'book-open',
    points: 20,
    category: 'Edukasi',
  },
  {
    id: 4,
    title: 'Meditasi',
    description: 'Sesi menenangkan pikiran selama 10 menit di pagi hari.',
    icon: 'self-improvement',
    points: 15,
    category: 'Mental Health',
  },
  {
    id: 5,
    title: 'Belajar Coding',
    description: 'Selesaikan satu modul TypeScript atau React.',
    icon: 'code',
    points: 100,
    category: 'Edukasi',
  },
  {
    id: 6,
    title: 'Membersihkan Meja',
    description: 'Rapikan ruang kerja agar fokus tetap terjaga.',
    icon: 'cleaning-services',
    points: 5,
    category: 'Produktivitas',
  },
  {
    id: 7,
    title: 'Makan Buah',
    icon: 'apple',
    points: 10,
    category: 'Kesehatan',
  },
  {
    id: 8,
    title: 'Review Keuangan',
    description: 'Catat pengeluaran harian ke dalam aplikasi budget.',
    icon: 'payments',
    points: 30,
    category: 'Finansial',
  },
  {
    id: 9,
    title: 'Tidur Tepat Waktu',
    description: 'Pastikan sudah tidur sebelum jam 11 malam.',
    icon: 'bedtime',
    points: 25,
    category: 'Kesehatan',
  },
  {
    id: 10,
    title: 'Update Portofolio',
    icon: 'work-history',
    points: 150,
    category: 'Karir',
  },
]

export default function Achievements() {
  const [openAchievements, setOpenAchievements] = useState(false)

  return (
    <div>
      <div className="flex justify-between mb-3">
        <h2 className="text-white font-semibold">Achievements</h2>

        {achievements.length > 4 && (
          <button
            onClick={() => setOpenAchievements(!openAchievements)}
            className="text-blue-400 text-sm cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {achievements.slice(0, 4).map((item, i) => (
          <div
            key={i}
            className="bg-[#0B1220] border border-white/10 rounded-xl p-4 text-center"
          >
            <div className="h-12 mb-2 bg-white/10 rounded-lg" />
            <p className="text-sm text-white">{item.title}</p>
            <p className="text-blue-400 text-xs mt-1">{item.points}</p>
          </div>
        ))}
      </div>
      <CollectionOverlay
        open={openAchievements}
        onClose={() => setOpenAchievements(false)}
        title="Achievements"
        items={achievements}
      />
    </div>
  )
}
