'use client'

import { motion, AnimatePresence } from 'framer-motion'

export default function BookModal({
  open,
  onClose,
  data,
}: {
  open: boolean
  onClose: () => void
  data: any
}) {
  return (
    <AnimatePresence>
      {open && data && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0B1220] border border-white/10 rounded-xl p-4"
          >
            {/* HEADER */}
            <div className="flex gap-4">
              <img
                src={data.book.coverImgUrl}
                className="w-20 h-28 object-cover rounded"
              />

              <div>
                <h3 className="text-white font-semibold">{data.book.title}</h3>
                <p className="text-xs text-gray-400">
                  {data.book.authors.join(', ')}
                </p>

                <p className="text-xs mt-2 text-blue-400 capitalize">
                  {data.shelfStatus.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* PROGRESS */}
            <div className="mt-4">
              <div className="w-full bg-white/10 h-2 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {data.progress}% completed
              </p>
            </div>

            {/* NOTES */}
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {data.notes.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada notes</p>
              ) : (
                data.notes.map((note: any) => (
                  <div key={note.id} className="bg-white/5 p-2 rounded">
                    {note.pageStart && (
                      <p className="text-xs text-blue-400">
                        Page {note.pageStart}
                        {note.pageEnd ? ` - ${note.pageEnd}` : ''}
                      </p>
                    )}
                    <p className="text-sm text-white">{note.description}</p>
                  </div>
                ))
              )}
            </div>

            {/* CLOSE */}
            <button
              onClick={onClose}
              className="mt-4 w-full bg-white/10 py-2 rounded text-sm"
            >
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
