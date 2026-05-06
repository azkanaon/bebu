'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import ExpandableNotes from './ExpandableNotes'
import ExpandableMansoryNotes from './ExpandableMansoryNotes'
import { Listbox } from '@headlessui/react'
import { ChevronsUpDownIcon, X } from 'lucide-react'
import Image from 'next/image'
import ClientPortal from '../ClientPortal'

export default function BookModal({
  open,
  onClose,
  data,
}: {
  open: boolean
  onClose: () => void
  data: any
}) {
  const [status, setStatus] = useState(data?.shelfStatus)

  const options = [
    {
      value: 'want_to_read',
      label: 'Want to Read',
      color: 'text-blue-400',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
    },
    {
      value: 'reading',
      label: 'Reading',
      color: 'text-orange-400',
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/10',
    },
    {
      value: 'done',
      label: 'Done',
      color: 'text-green-400',
      border: 'border-green-500/30',
      bg: 'bg-green-500/10',
    },
  ]
  const selected = options.find((o) => o.value === status) || options[0]

  return (
    <AnimatePresence>
      {open && data && (
        <ClientPortal>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm hidden md:block"
          />

          {/* WRAPPER */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center md:p-6">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full h-full md:h-auto md:max-h-[85vh] md:w-[90%] md:max-w-5xl bg-[#0B1220] md:rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* MAIN CONTENT AREA */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* KOLOM KIRI: Info Buku (Di Mobile ini jadi Header) */}
                <div className="shrink-0 w-full md:w-[320px] lg:w-[380px] p-6 bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar">
                  {/* Layout Cover + Info (Mobile: Side by side | Desktop: Stacked) */}
                  <div className="flex gap-4 md:flex-col items-start">
                    {/* COVER */}
                    <div className="w-24 h-36 md:w-full md:h-48 relative shrink-0 shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                      {/* FOTO BELAKANG (Blur & Cover) */}
                      <Image
                        src={data.book.coverImgUrl}
                        className="object-cover blur-lg"
                        alt=""
                        fill
                        priority
                      />

                      {/* FOTO DEPAN (Contain) */}
                      <Image
                        src={data.book.coverImgUrl}
                        className="object-contain relative z-10"
                        alt={data.book.title}
                        fill
                      />
                    </div>

                    {/* INFO GROUP (Title, Author, Status, Progress) */}
                    <div className="flex-1 flex flex-col w-full">
                      <h3 className="text-white font-bold text-lg md:text-2xl leading-tight md:mt-2 line-clamp-2 md:line-clamp-none">
                        {data.book.title}
                      </h3>
                      <p className="text-[11px] md:text-sm text-gray-500 mt-1">
                        {data.book.authors.join(', ')}
                      </p>

                      {/* STATUS & PROGRESS (Hanya muncul di samping cover saat Mobile) */}
                      <div className="mt-3 space-y-3 md:hidden">
                        <StatusSelect
                          status={status}
                          setStatus={setStatus}
                          selected={selected}
                          options={options}
                        />

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-500">
                            <span>Progress</span>
                            <span className="text-blue-400">
                              {data.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${data.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STATUS & PROGRESS (Hanya muncul saat Desktop mode) */}
                  <div className="hidden md:block mt-10 space-y-8">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-3 block">
                        Reading Status
                      </label>
                      <StatusSelect
                        status={status}
                        setStatus={setStatus}
                        selected={selected}
                        options={options}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">
                          Progress
                        </label>
                        <span className="text-xs font-bold text-blue-400">
                          {data.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${data.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* KOLOM KANAN: Reading Notes (Area Luas) */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-6 md:p-10 pb-3 md:pb-6 flex items-center justify-between">
                    <h4 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black">
                      Reading Notes
                    </h4>
                    <span className="text-[10px] text-gray-600 font-bold bg-white/5 px-2 py-1 rounded-md">
                      {data.notes.length} NOTES
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 custom-scrollbar">
                    {data.notes.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl opacity-50">
                        <p className="text-xs text-gray-500 italic">
                          No notes found
                        </p>
                      </div>
                    ) : (
                      // <ExpandableMansoryNotes notes={data.notes} />
                      <ExpandableNotes notes={data.notes} />
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER ACTION */}
              <div className="shrink-0 p-5 bg-[#0B1220] border-t border-white/5">
                <button
                  onClick={onClose}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-4 md:py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all border border-white/5 active:scale-95 cursor-pointer"
                >
                  Close Reader Details
                </button>
              </div>

              {/* Close Button Desktop */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors hidden md:block cursor-pointer"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}

function StatusSelect({ status, setStatus, selected, options }: any) {
  return (
    <Listbox value={status} onChange={setStatus}>
      <div className="relative">
        <Listbox.Button
          className={`relative w-full rounded-xl border px-3 py-2.5 text-left text-[9px] md:text-[10px] font-black transition-all ${selected.color} ${selected.border} ${selected.bg}`}
        >
          <span className="block truncate uppercase tracking-widest">
            {selected.label}
          </span>
          <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <ChevronsUpDownIcon className="w-3 h-3 opacity-30" />
          </span>
        </Listbox.Button>
        <Listbox.Options className="absolute z-[130] bottom-full md:bottom-auto md:mt-2 mb-2 md:mb-0 w-full rounded-xl border border-white/10 bg-[#111827] p-1 shadow-2xl outline-none backdrop-blur-xl">
          {options.map((option: any) => (
            <Listbox.Option
              key={option.value}
              value={option.value}
              className={({ active, selected }) =>
                `cursor-pointer select-none rounded-lg px-3 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${option.color} ${active ? option.bg : ''} ${selected ? 'bg-white/5' : 'opacity-40'}`
              }
            >
              {option.label}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  )
}
