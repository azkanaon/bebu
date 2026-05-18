'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Quote,
  MessageSquare,
  X,
  Pencil,
  Trash2,
} from 'lucide-react' // Import Lucide Icons
import { Note, NoteType } from '@/types/bookshelf'
import { useDeleteNote } from '@/api/bookshelf/useBookshelf'
import ConfirmModal from './ConfirmModal'

// Helper untuk Icon berdasarkan Type dengan Type-Safety
const NoteIcon = ({ type, size = 12 }: { type: NoteType; size?: number }) => {
  switch (type) {
    case 'insight':
      return <Lightbulb size={size} className="text-amber-400" />
    case 'quote':
      return <Quote size={size} className="text-blue-400" />
    case 'summary':
      return <MessageSquare size={size} className="text-emerald-400" />
    default:
      return null
  }
}

interface ExpandableNotesProps {
  notes: Note[]
  bookshelfId: number
  isOwner: boolean
  onEdit: (note: Note) => void // Callback untuk memicu modal edit
}

export default function ExpandableNotes({
  notes,
  bookshelfId,
  isOwner,
  onEdit,
}: ExpandableNotesProps) {
  const [selected, setSelected] = useState<Note | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null)

  const { mutate: deleteNote, isPending: isDeleting } =
    useDeleteNote(bookshelfId)

  const handleConfirmDelete = () => {
    if (noteToDelete) deleteNote(noteToDelete)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            layoutId={`note-${note.id}`}
            onClick={() => setSelected(note)}
            // Tambahkan class 'group' untuk mendeteksi hover pada anak elemen
            className="group relative cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between hover:border-blue-500/30 transition-all"
          >
            <div className="relative z-10 pointer-events-none">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg">
                  <NoteIcon type={note.type} size={14} />
                  <span className="text-[9px] font-black uppercase text-gray-400">
                    {note.type}
                  </span>
                </div>
                {note.pageStart && (
                  <p className="text-[10px] font-mono text-blue-400">
                    Pg. {note.pageStart}{' '}
                    {note.pageEnd ? `- ${note.pageEnd}` : ''}
                  </p>
                )}
              </div>
              <p className="text-sm text-white line-clamp-3 leading-relaxed">
                {note.description}
              </p>
            </div>

            {/* Tombol Aksi (Hanya Muncul saat Hover & Jika Owner) */}
            {isOwner && (
              <div className="absolute bottom-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Edit clicked for note:', note.id) // Debug log
                    onEdit(note)
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setNoteToDelete(note.id) // Buka Confirm Modal
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Tanggal (Akan hilang saat tombol aksi muncul agar tidak bertumpukan) */}
            <p className="text-[10px] text-gray-600 mt-4 font-medium uppercase group-hover:opacity-0 transition-opacity">
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
          </motion.div>
        ))}
      </div>
      <ConfirmModal
        open={noteToDelete !== null}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Note?"
        message="This action cannot be undone. This note will be permanently removed from your book record."
        confirmText="Delete Now"
        isDestructive={true}
        isPending={isDeleting}
      />
      {/* POPUP DETAIL */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-200 bg-black/80 backdrop-blur-md"
              onClick={() => setSelected(null)}
            />

            <div className="fixed inset-0 z-210 flex items-center justify-center p-4 cursor-default pointer-events-none">
              <motion.div
                layoutId={`note-${selected.id}`}
                onClick={(e) => e.stopPropagation()}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="pointer-events-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0B1220] p-8 shadow-2xl overflow-hidden relative"
              >
                {/* HEADER DETAIL */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <NoteIcon type={selected.type} size={20} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        {selected.type} Note
                      </h4>
                      {(selected.pageStart || selected.pageEnd) && (
                        <p className="text-sm text-blue-400 font-bold uppercase tracking-widest mt-0.5">
                          Page {selected.pageStart}
                          {selected.pageEnd ? ` - ${selected.pageEnd}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* CONTENT */}
                <div className="max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base font-medium">
                    {selected.description}
                  </p>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between mt-10 pt-5 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                      Recorded on
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(selected.createdAt).toLocaleDateString(
                        undefined,
                        {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelected(null)}
                    className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
