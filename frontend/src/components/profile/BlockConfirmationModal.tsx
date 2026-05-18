'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import ClientPortal from '../ClientPortal'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  username: string
  isPending?: boolean
}

export default function BlockConfirmModal({
  open,
  onClose,
  onConfirm,
  username,
  isPending,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-100"
          />

          {/* MODAL CONTENT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0B1220] border border-white/10 rounded-3xl p-6 z-110 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <ShieldAlert size={32} />
            </div>

            <h3 className="text-white font-bold text-lg mb-2 tracking-tight ">
              Block @{username}?
            </h3>

            <p className="text-gray-400 text-xs leading-relaxed mb-6 px-2">
              They will no longer be able to follow you, see your posts, or find
              your profile. They won&apos;t be notified that you blocked them.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 text-[10px] font-bold uppercase hover:bg-white/10 transition-colors outline-none disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-[10px] font-bold uppercase hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 outline-none active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </motion.div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}
