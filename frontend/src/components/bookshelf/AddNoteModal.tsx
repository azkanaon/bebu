'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb, Quote, MessageSquare } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bookshelfService } from '@/services/bookshelf.service'
import { Note, NoteType } from '@/types/bookshelf' // Pastikan Note diimport
import { toast } from 'sonner'
import ClientPortal from '../ClientPortal'
import { useUpdateNote } from '@/api/bookshelf/useBookshelf'

interface AddNoteModalProps {
  open: boolean
  onClose: () => void
  bookshelfId: number
  editData?: Note | null // Tambahkan parameter ini
}

export default function AddNoteModal({
  open,
  onClose,
  bookshelfId,
  editData,
}: AddNoteModalProps) {
  const queryClient = useQueryClient()

  // State Form
  const [type, setType] = useState<NoteType>('insight')
  const [description, setDescription] = useState('')
  const [pageStart, setPageStart] = useState<string>('')
  const [pageEnd, setPageEnd] = useState<string>('')

  // Mutation Hooks
  const { mutate: createNote, isPending: isCreating } = useMutation({
    mutationFn: () =>
      bookshelfService.createNote(bookshelfId, {
        type,
        description,
        page_start: pageStart ? Number(pageStart) : undefined,
        page_end: pageEnd ? Number(pageEnd) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', bookshelfId] })
      toast.success('Note added successfully!')
      handleClose()
    },
  })

  const { mutate: updateNote, isPending: isUpdating } =
    useUpdateNote(bookshelfId)

  // SINKRONISASI DATA (Jika mode edit, isi form dengan data lama)
  useEffect(() => {
    if (open) {
      if (editData) {
        setType(editData.type)
        setDescription(editData.description)
        setPageStart(editData.pageStart?.toString() || '')
        setPageEnd(editData.pageEnd?.toString() || '')
      } else {
        // Reset jika mode tambah baru
        setType('insight')
        setDescription('')
        setPageStart('')
        setPageEnd('')
      }
    }
  }, [open, editData])

  const handleClose = () => {
    onClose()
    // Reset form setelah animasi selesai
    setTimeout(() => {
      setDescription('')
      setPageStart('')
      setPageEnd('')
    }, 300)
  }

  const handleSave = () => {
    const payload = {
      type,
      description,
      page_start: pageStart ? Number(pageStart) : undefined,
      page_end: pageEnd ? Number(pageEnd) : undefined,
    }

    if (editData) {
      // Jalankan Update
      updateNote(
        { noteId: editData.id, payload },
        {
          onSuccess: () => handleClose(),
        },
      )
    } else {
      // Jalankan Create
      createNote()
    }
  }

  const isPending = isCreating || isUpdating

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-200 bg-black/80 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-210 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="pointer-events-auto w-full max-w-xl bg-[#0B1220] border border-white/10 rounded-4xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                <h2 className="text-white text-sm font-bold uppercase tracking-widest">
                  {editData ? 'Edit Reading Note' : 'New Reading Note'}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-white cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="flex gap-3">
                  <TypeOption
                    active={type === 'insight'}
                    onClick={() => setType('insight')}
                    icon={<Lightbulb size={16} />}
                    label="Insight"
                    color="amber"
                  />
                  <TypeOption
                    active={type === 'quote'}
                    onClick={() => setType('quote')}
                    icon={<Quote size={16} />}
                    label="Quote"
                    color="blue"
                  />
                  <TypeOption
                    active={type === 'summary'}
                    onClick={() => setType('summary')}
                    icon={<MessageSquare size={16} />}
                    label="Summary"
                    color="emerald"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputGroup
                    label="Page Start"
                    value={pageStart}
                    onChange={setPageStart}
                  />
                  <InputGroup
                    label="Page End"
                    value={pageEnd}
                    onChange={setPageEnd}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write your thoughts here..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-5 text-sm text-white outline-none focus:border-blue-500/50 min-h-40 resize-none transition-all"
                  />
                </div>
              </div>

              <div className="p-6 bg-white/2 border-t border-white/5 flex gap-4">
                <button
                  onClick={handleClose}
                  className="flex-1 py-4 text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!description || isPending}
                  className="flex-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 transition-all disabled:opacity-30 cursor-pointer"
                >
                  {isPending
                    ? 'Processing...'
                    : editData
                      ? 'Update Note'
                      : 'Save Note'}
                </button>
              </div>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}

// --- SUB COMPONENTS (CLEAN) ---

function InputGroup({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white outline-none focus:border-blue-500/50"
      />
    </div>
  )
}

function TypeOption({
  active,
  onClick,
  icon,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  color: 'amber' | 'blue' | 'emerald'
}) {
  const colors = {
    amber: active
      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
      : 'text-gray-500',
    blue: active
      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
      : 'text-gray-500',
    emerald: active
      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
      : 'text-gray-500',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-3xl border border-white/5 transition-all cursor-pointer ${colors[color]} ${active ? '' : 'hover:bg-white/5'}`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">
        {label}
      </span>
    </button>
  )
}
