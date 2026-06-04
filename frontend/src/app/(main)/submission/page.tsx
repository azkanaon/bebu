'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Loader2, Inbox, Pencil, Trash2 } from 'lucide-react'
import {
  useInfiniteMySubmissions,
  useDeleteSubmission,
} from '@/api/submission/useSubmission'
import { useInView } from 'react-intersection-observer'
import { MySubmissionItem } from '@/types/submission'
import { SubmissionCard } from '@/components/book-submission/SubmissionCard'
import ConfirmModal from '@/components/bookshelf/ConfirmModal'
import BookSubmissionModal from '@/components/book-submission/BookSubmissionModal'

export default function MySubmissionsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [submissionToEdit, setSubmissionToEdit] =
    useState<MySubmissionItem | null>(null)
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(
    null,
  )

  const { ref, inView } = useInView()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteMySubmissions('pending')
  const { mutate: deleteSubmission, isPending: isDeleting } =
    useDeleteSubmission()

  const submissions = useMemo(() => {
    const allItems = data?.pages.flatMap((p) => p.data ?? []) || []
    return allItems.filter((item): item is MySubmissionItem => item !== null)
  }, [data])

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  const handleOpenEdit = (item: MySubmissionItem) => {
    setSubmissionToEdit(item)
    setIsAddModalOpen(true)
  }

  return (
    <div className="max-w-[600px] py-8 text-slate-200">
      {/* 1. HEADER DENGAN TOMBOL ADD */}
      <header className="mb-10 px-4 sm:px-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Book Submissions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your pending book requests
          </p>
        </div>
        <button
          onClick={() => {
            setSubmissionToEdit(null)
            setIsAddModalOpen(true)
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          <span className="hidden sm:block">Request Book</span>
        </button>
      </header>

      <main className="space-y-4 px-4 sm:px-0">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : submissions.length > 0 ? (
          <>
            {submissions.map((item) => (
              <SubmissionCard
                key={item.id}
                item={item}
                onEdit={() => handleOpenEdit(item)}
                onDelete={() => setSubmissionToDelete(item.id)}
              />
            ))}
            <div ref={ref} className="py-10 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="animate-spin text-blue-500" size={20} />
              )}
            </div>
          </>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center bg-[#0B1220]/40 border border-dashed border-white/5 rounded-[2.5rem] text-slate-600 text-center px-6">
            <Inbox size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No pending requests found.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 text-blue-500 text-xs font-bold uppercase tracking-widest cursor-pointer hover:text-blue-400 transition-colors"
            >
              Start a new request
            </button>
          </div>
        )}
      </main>

      {/* MODAL KONFIRMASI HAPUS */}
      <ConfirmModal
        // 1. Pastikan pengecekan open benar
        open={submissionToDelete !== null}
        // 2. Pastikan onClose mereset state yang tepat
        onClose={() => setSubmissionToDelete(null)}
        // 3. Pastikan onConfirm memicu mutasi dan mereset state saat sukses
        onConfirm={() => {
          if (submissionToDelete) {
            deleteSubmission(submissionToDelete, {
              onSuccess: () => {
                // TUTUP MODAL SETELAH SUKSES
                setSubmissionToDelete(null)
              },
            })
          }
        }}
        title="Delete Request?"
        message="Are you sure you want to delete this book submission?"
        confirmText="Delete Now"
        isDestructive={true}
        isPending={isDeleting}
      />

      {/* MODAL ADD/EDIT SUBMISSION */}
      <BookSubmissionModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSubmissionToEdit(null)
        }}
        editData={submissionToEdit}
      />
    </div>
  )
}
