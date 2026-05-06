'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BookCard from './BookCard'
import BookModal from './BookModal'

type Note = {
  id: number
  pageStart?: number
  pageEnd?: number
  description: string
  createdAt: string
}

type BookItem = {
  publicId: string
  book: {
    publicId: string
    title: string
    coverImgUrl: string
    totalPages: number
    authors: string[]
  }
  shelfStatus: 'want_to_read' | 'reading' | 'done'
  progress: number // 0–100
  notes: Note[]
}

// 🔥 DUMMY DATA
const dummy: BookItem[] = [
  {
    publicId: '1',
    book: {
      publicId: 'b1',
      title: 'Atomic Habits',
      coverImgUrl: 'https://picsum.photos/seed/atomic/200/300',
      totalPages: 320,
      authors: ['James Clear'],
    },
    shelfStatus: 'reading',
    progress: 45,
    notes: [
      {
        id: 1,
        pageStart: 50,
        pageEnd: 60,
        description: 'Habit stacking itu powerful banget.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    publicId: '2',
    book: {
      publicId: 'b2',
      title: 'Deep Work',
      coverImgUrl: 'https://picsum.photos/seed/deep/200/300',
      totalPages: 280,
      authors: ['Cal Newport'],
    },
    shelfStatus: 'want_to_read',
    progress: 0,
    notes: [],
  },
  {
    publicId: '3',
    book: {
      publicId: 'b3',
      title: 'The Pragmatic Programmer',
      coverImgUrl: 'https://picsum.photos/seed/pragmatic/200/300',
      totalPages: 350,
      authors: ['Andrew Hunt'],
    },
    shelfStatus: 'done',
    progress: 100,
    notes: [
      {
        id: 1,
        pageStart: 1,
        pageEnd: 12,
        description:
          'Premis awal yang menarik, saya sendiri kaget ada awal cerita seperti ini',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        pageStart: 13,
        pageEnd: 25,
        description:
          'Pengenalan karakter utama terasa sangat organik. Penulis berhasil membangun empati pembaca sejak bab pertama tanpa terkesan memaksa atau terlalu dramatis dalam menceritakan latar belakangnya.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        pageStart: 26,
        pageEnd: 40,
        description:
          'Konflik mulai muncul ke permukaan dengan tempo yang pas. Ada ketegangan yang mulai dibangun antara karakter pendukung yang membuat saya penasaran dengan motif asli mereka di masa depan.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        pageStart: 41,
        pageEnd: 55,
        description:
          'Deskripsi dunianya sangat mendetail tapi tidak membosankan. Saya bisa membayangkan suasana kota tua yang digambarkan dengan sangat jelas, seolah-olah saya sedang berjalan di gang-gang sempit tersebut.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        pageStart: 56,
        pageEnd: 68,
        description:
          'Dialog antar karakter terasa sangat natural dan memiliki bobot. Tidak ada percakapan yang sia-sia, semuanya memberikan petunjuk tentang plot besar yang sedang disiapkan oleh sang penulis.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 6,
        pageStart: 69,
        pageEnd: 82,
        description:
          'Ada elemen misteri yang tiba-tiba muncul di tengah bab ini. Penemuan sebuah benda kuno di gudang tua memberikan dimensi baru pada alur cerita yang awalnya terlihat sederhana.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 7,
        pageStart: 83,
        pageEnd: 95,
        description:
          'Perkembangan emosi tokoh utama sangat terasa di sini. Dia mulai mempertanyakan nilai-nilai yang selama ini diyakininya setelah bertemu dengan orang asing yang memiliki perspektif berbeda tentang hidup.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 8,
        pageStart: 96,
        pageEnd: 110,
        description:
          'Bab ini penuh dengan aksi yang mendebarkan. Penulis sangat mahir dalam menggambarkan adegan kejar-kejaran tanpa membuat pembaca bingung dengan posisi masing-masing karakter dalam ruangan tersebut.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 9,
        pageStart: 111,
        pageEnd: 120,
        description:
          'Momen hening yang sangat menyentuh hati. Interaksi antara ayah dan anak di bagian ini memberikan jeda yang dibutuhkan setelah rangkaian aksi yang cukup melelahkan di bagian sebelumnya.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 10,
        pageStart: 121,
        pageEnd: 135,
        description:
          'Plot twist pertama muncul secara tidak terduga. Saya harus membaca ulang beberapa halaman sebelumnya untuk memastikan bahwa saya tidak melewatkan petunjuk kecil yang ternyata sangat krusial ini.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 11,
        pageStart: 136,
        pageEnd: 150,
        description:
          'Antagonis diperkenalkan dengan cara yang sangat elegan. Dia bukan sekadar jahat, tapi memiliki alasan yang masuk akal di balik tindakannya, membuat batas antara benar dan salah menjadi abu-abu.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 12,
        pageStart: 151,
        pageEnd: 162,
        description:
          'Latar tempat berpindah ke daerah pegunungan yang dingin. Atmosfer yang dibangun terasa sangat mencekam dan penuh rahasia, menambah rasa waswas saat mengikuti perjalanan karakter utama ke sana.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 13,
        pageStart: 163,
        pageEnd: 175,
        description:
          'Teknik penceritaan menggunakan kilas balik memberikan konteks yang sangat kuat. Kita jadi tahu mengapa karakter tersebut memiliki ketakutan yang begitu besar terhadap kegelapan dan ruang tertutup.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 14,
        pageStart: 176,
        pageEnd: 188,
        description:
          'Kerja sama tim mulai terbentuk dengan dinamika yang menarik. Ada persaingan kecil namun mereka sadar bahwa ego masing-masing harus dikesampingkan demi mencapai tujuan bersama yang lebih besar.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 15,
        pageStart: 189,
        pageEnd: 200,
        description:
          'Deskripsi kuliner dalam buku ini membuat saya merasa lapar. Penulis bisa menggambarkan rasa dan aroma masakan tradisional dengan begitu puitis sehingga terasa sangat nyata di indra perasa.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 16,
        pageStart: 201,
        pageEnd: 215,
        description:
          'Bagian ini sedikit melambat namun memberikan pendalaman filosofis yang cukup dalam. Diskusi tentang takdir dan pilihan bebas memberikan bahan renungan bagi pembaca di sela-sela cerita utama.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 17,
        pageStart: 216,
        pageEnd: 230,
        description:
          'Sebuah pengkhianatan terjadi dari arah yang paling tidak terduga. Karakter yang selama ini terlihat paling setia ternyata memiliki agenda tersembunyi yang bisa merusak semua rencana yang sudah disusun.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 18,
        pageStart: 231,
        pageEnd: 245,
        description:
          'Konsekuensi dari keputusan di bab sebelumnya mulai terasa berat. Karakter utama harus kehilangan sesuatu yang sangat berharga, dan duka yang digambarkan di sini terasa sangat menyesakkan dada.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 19,
        pageStart: 246,
        pageEnd: 260,
        description:
          'Munculnya karakter mentor baru memberikan harapan segar. Meskipun bicaranya kasar dan sarkastik, pengetahuannya tentang sejarah dunia ini sangat membantu dalam memecahkan kode-kode kuno yang ditemukan.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 20,
        pageStart: 261,
        pageEnd: 272,
        description:
          'Eksplorasi ke dalam hutan terlarang yang penuh dengan makhluk ajaib. Imajinasi penulis benar-benar liar dalam menciptakan ekosistem baru yang unik namun tetap terasa memiliki logika internal yang kuat.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 21,
        pageStart: 273,
        pageEnd: 285,
        description:
          'Rahasia keluarga yang selama ini dipendam akhirnya terungkap di sini. Hubungan darah ternyata memiliki peran penting dalam kemampuan sihir yang mulai bangkit dalam diri sang protagonis utama.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 22,
        pageStart: 286,
        pageEnd: 300,
        description:
          'Ketegangan politik antar kerajaan mencapai titik didih. Pertemuan diplomatik yang seharusnya membawa perdamaian justru berubah menjadi ajang saling tuduh yang mempercepat terjadinya perang besar di masa depan.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 23,
        pageStart: 301,
        pageEnd: 315,
        description:
          'Momen latihan yang keras menunjukkan dedikasi karakter utama untuk menjadi lebih kuat. Proses ini tidak instan, ada keringat dan air mata yang membuatnya terasa sangat pantas untuk menang.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 24,
        pageStart: 316,
        pageEnd: 330,
        description:
          'Penggunaan analogi dalam narasi di bab ini sangat cerdas. Penulis membandingkan situasi hidup karakter dengan permainan catur, di mana setiap langkah memiliki risiko yang harus diperhitungkan dengan matang.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 25,
        pageStart: 331,
        pageEnd: 345,
        description:
          'Sisi gelap dari teknologi yang mereka gunakan mulai terlihat dampaknya pada lingkungan sekitar. Ada pesan moral yang kuat tentang bagaimana ambisi manusia bisa merusak alam jika tidak dikendalikan.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 26,
        pageStart: 346,
        pageEnd: 360,
        description:
          'Pertemuan kembali dengan sahabat masa kecil membawa nostalgia yang manis namun pahit. Banyak hal telah berubah di antara mereka, membuat percakapan terasa canggung sekaligus penuh kerinduan mendalam.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 27,
        pageStart: 361,
        pageEnd: 375,
        description:
          'Rencana besar untuk menyusup ke markas musuh mulai disusun dengan sangat detail. Strategi yang dibuat melibatkan semua keahlian unik dari masing-masing anggota tim, menunjukkan betapa solidnya mereka sekarang.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 28,
        pageStart: 376,
        pageEnd: 390,
        description:
          'Bab ini berfungsi sebagai penenang sebelum badai besar melanda. Para karakter berkumpul mengelilingi api unggun, berbagi cerita dan tawa, seolah tahu bahwa esok hari segalanya mungkin akan berakhir.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 29,
        pageStart: 391,
        pageEnd: 410,
        description:
          'Awal dari pertempuran final yang sangat epik. Skala konfliknya meluas, melibatkan ribuan orang, namun penulis tetap fokus pada perjalanan personal karakter utama di tengah kekacauan medan perang tersebut.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 30,
        pageStart: 411,
        pageEnd: 425,
        description:
          'Resolusi yang sangat memuaskan meskipun meninggalkan sedikit rasa sedih. Semua pertanyaan terjawab, namun dunia tidak lagi sama, memberikan ruang bagi pembaca untuk merenungkan akhir perjalanan panjang yang luar biasa ini.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
]

const statusTabs = [
  { key: 'want_to_read', label: 'Want to Read' },
  { key: 'reading', label: 'Reading' },
  { key: 'done', label: 'Done' },
] as const

export default function BookshelfTab() {
  const [active, setActive] =
    useState<(typeof statusTabs)[number]['key']>('reading')
  const [selected, setSelected] = useState<BookItem | null>(null)

  const filtered = dummy.filter((b) => b.shelfStatus === active)

  return (
    <div>
      {/* STATUS TABS */}
      <div className="flex justify-end gap-6 border-b border-white/10 mb-4 relative">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="relative pb-2 text-sm"
          >
            <span
              className={active === tab.key ? 'text-white' : 'text-gray-400'}
            >
              {tab.label}
            </span>

            {active === tab.key && (
              <motion.div
                layoutId="books-tab-underline"
                className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-blue-500 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* GRID */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {filtered.map((item) => (
            <BookCard
              key={item.publicId}
              item={item}
              onClick={() => setSelected(item)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* MODAL */}
      <BookModal
        open={!!selected}
        onClose={() => setSelected(null)}
        data={selected}
      />
    </div>
  )
}
