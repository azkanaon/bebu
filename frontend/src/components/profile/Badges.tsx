'use client'

import { useState } from 'react'
import CollectionOverlay from './CollectionOverlay'

const badges = [
  {
    id: 11,
    title: 'Journaling Harian',
    description:
      'Tuliskan tiga hal yang patut disyukuri hari ini untuk meningkatkan mood.',
    icon: 'edit-note',
    points: 15,
    category: 'Mental Health',
  },
  {
    id: 12,
    title: 'Podcasting',
    description:
      'Dengarkan podcast teknologi terbaru selama 30 menit perjalanan.',
    icon: 'mic',
    points: 20,
    category: 'Edukasi',
  },
  {
    id: 13,
    title: 'Yoga Sederhana',
    description: 'Peregangan otot punggung dan leher setelah bekerja seharian.',
    icon: 'fitness-center',
    points: 25,
    category: 'Olahraga',
  },
  {
    id: 14,
    title: 'Zero Inbox',
    description:
      'Rapikan dan balas semua email penting agar kotak masuk bersih.',
    icon: 'email',
    points: 40,
    category: 'Produktivitas',
  },
  {
    id: 15,
    title: 'Masak Makan Malam',
    icon: 'restaurant',
    points: 30,
    category: 'Lifestyle',
  },
  {
    id: 16,
    title: 'Investasi Saham',
    description:
      'Lakukan analisis fundamental singkat dan top-up portofolio bulanan.',
    icon: 'trending-up',
    points: 80,
    category: 'Finansial',
  },
  {
    id: 17,
    title: 'Siram Tanaman',
    description:
      'Pastikan tanaman di teras mendapatkan air yang cukup di musim panas.',
    icon: 'local-florist',
    points: 10,
    category: 'Hobi',
  },
  {
    id: 18,
    title: 'Belajar Bahasa Baru',
    description: 'Latihan 10 kosakata baru di aplikasi Duolingo.',
    icon: 'translate',
    points: 35,
    category: 'Edukasi',
  },
  {
    id: 19,
    title: 'Digital Detox',
    description: 'Matikan semua layar gadget 1 jam sebelum waktu tidur.',
    icon: 'phonelink-off',
    points: 50,
    category: 'Kesehatan',
  },
  {
    id: 20,
    title: 'Donasi Sosial',
    icon: 'volunteer-activism',
    points: 100,
    category: 'Sosial',
  },
]

export default function Badges() {
  const [openBadges, setOpenBadges] = useState(false)

  return (
    <div>
      <div className="flex justify-between mb-3">
        <h2 className="text-white font-semibold">Badges</h2>

        {badges.length > 4 && (
          <button
            onClick={() => setOpenBadges(!openBadges)}
            className="text-blue-400 text-sm cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {badges.slice(0, 4).map((item, i) => (
          <div
            key={i}
            className="bg-[#0B1220] border border-white/10 rounded-xl p-4 text-center"
          >
            <div className="h-12 mb-2 bg-white/10 rounded-full" />
            <p className="text-sm text-white">{item.title}</p>
            <p className="text-xs text-gray-400 mt-1">{item.description}</p>
          </div>
        ))}
      </div>
      <CollectionOverlay
        open={openBadges}
        onClose={() => setOpenBadges(false)}
        title="Badges"
        items={badges}
      />
    </div>
  )
}
