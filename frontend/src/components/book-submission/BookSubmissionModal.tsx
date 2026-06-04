'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Send,
  BookMarked,
} from 'lucide-react'
import { useSubmitBook } from '@/api/submission/useSubmission'
import { submissionService } from '@/services/submission.service'
import { AuthorInput, GenreInput, MySubmissionItem } from '@/types/submission'
import ClientPortal from '../ClientPortal'
import TagSelector from './TagSelector'

interface Props {
  open: boolean
  onClose: () => void
  editData?: MySubmissionItem | null
}

export default function BookSubmissionModal({
  open,
  onClose,
  editData,
}: Props) {
  const [step, setStep] = useState(1)
  const { mutate: submit, isPending } = useSubmitBook()

  // --- FORM STATES ---
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState<AuthorInput[]>([])
  const [genres, setGenres] = useState<GenreInput[]>([])
  const [isbn, setIsbn] = useState('')
  const [year, setYear] = useState('')
  const [pages, setPages] = useState('')
  const [language, setLanguage] = useState('English')
  const [synopsis, setSynopsis] = useState('')
  const [userNote, setUserNote] = useState('')
  const [cover, setCover] = useState<File | null>(null)

  // Sync data jika dalam mode edit
  useEffect(() => {
    if (open && editData) {
      setTitle(editData.title)
      setAuthors(editData.authors.map((name) => ({ name })))
      setGenres(editData.genres.map((name) => ({ name })))
      setYear(String(editData.publicationYear || ''))
      setUserNote(editData.userNote || '')
      setStep(1)
    } else if (open) {
      // Reset form jika mode tambah baru
      resetForm()
    }
  }, [open, editData])

  const resetForm = () => {
    setTitle('')
    setAuthors([])
    setGenres([])
    setIsbn('')
    setYear('')
    setPages('')
    setLanguage('English')
    setSynopsis('')
    setUserNote('')
    setCover(null)
    setStep(1)
  }

  const handleFinalSubmit = () => {
    submit(
      {
        title,
        authors,
        genres,
        synopsis,
        language,
        isbn,
        total_pages: pages ? Number(pages) : undefined,
        publication_year: year ? Number(year) : undefined,
        user_note: userNote,
        cover,
      },
      { onSuccess: onClose },
    )
  }

  const isNextDisabled =
    step === 1 && (!title || authors.length === 0 || genres.length === 0)

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="pointer-events-auto w-full max-w-xl bg-[#0B1220] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* HEADER */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/10 rounded-2xl">
                    <BookMarked size={20} className="text-blue-500" />
                  </div>
                  <h2 className="text-white text-sm font-bold uppercase tracking-widest">
                    {editData ? 'Edit Request' : 'Request New Book'}
                  </h2>
                </div>
                <div className="text-[10px] font-black text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  STEP {step} OF 3
                </div>
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="s1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <InputGroup
                        label="Book Title *"
                        value={title}
                        onChange={setTitle}
                        placeholder="The full title of the book"
                      />
                      <TagSelector
                        label="Authors *"
                        placeholder="Search existing or type new author..."
                        selectedTags={authors}
                        onAdd={(t) => setAuthors([...authors, t])}
                        onRemove={(i) =>
                          setAuthors(authors.filter((_, idx) => idx !== i))
                        }
                        searchFn={submissionService.searchAuthors}
                      />
                      <TagSelector
                        label="Genres *"
                        placeholder="Search existing or type new genre..."
                        selectedTags={genres}
                        onAdd={(t) => setGenres([...genres, t])}
                        onRemove={(i) =>
                          setGenres(genres.filter((_, idx) => idx !== i))
                        }
                        searchFn={submissionService.searchGenres}
                      />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="s2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    >
                      <InputGroup
                        label="ISBN"
                        value={isbn}
                        onChange={setIsbn}
                        placeholder="978-..."
                      />
                      <InputGroup
                        label="Pub. Year"
                        value={year}
                        onChange={setYear}
                        type="number"
                        placeholder="YYYY"
                      />
                      <InputGroup
                        label="Total Pages"
                        value={pages}
                        onChange={setPages}
                        type="number"
                        placeholder="0"
                      />
                      <InputGroup
                        label="Language"
                        value={language}
                        onChange={setLanguage}
                        placeholder="e.g. Indonesian"
                      />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="s3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Book Cover
                        </label>
                        <div className="relative aspect-video rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer overflow-hidden group">
                          {cover ? (
                            <img
                              src={URL.createObjectURL(cover)}
                              className="object-contain h-full w-full p-4"
                              alt=""
                            />
                          ) : (
                            <div className="text-center space-y-2">
                              <Upload
                                size={24}
                                className="mx-auto text-slate-600 group-hover:text-blue-500 transition-colors"
                              />
                              <p className="text-xs text-slate-500 font-medium">
                                Click to select image file
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setCover(e.target.files?.[0] || null)
                            }
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Note for Admin
                        </label>
                        <textarea
                          value={userNote}
                          onChange={(e) => setUserNote(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white outline-none focus:border-blue-500/40 min-h-32 resize-none"
                          placeholder="Explain why this book should be added..."
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FOOTER NAV */}
              <div className="p-6 bg-white/[0.01] border-t border-white/5 flex gap-4">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 py-4 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent hover:border-white/5 rounded-2xl"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={isNextDisabled}
                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isPending}
                    className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isPending ? 'Sending...' : 'Send Request'}{' '}
                    <Send size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}

// --- SUB COMPONENT (Typed) ---
function InputGroup({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-sm text-white outline-none focus:border-blue-500/40 transition-all"
      />
    </div>
  )
}
