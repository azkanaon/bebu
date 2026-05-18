'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import ClientPortal from '../ClientPortal'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  isDestructive?: boolean
  isPending?: boolean
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  isDestructive = false,
  isPending = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          {/* BACKDROP: z-index sangat tinggi agar di atas modal apapun */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-300 bg-black/80 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-310 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pointer-events-auto w-full max-w-sm bg-[#0B1220] border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}
              >
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-tight">
                {title}
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-8 px-2">
                {message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 text-[10px] font-black uppercase hover:bg-white/10 transition-all cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className={`flex-1 py-3 rounded-xl text-white text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 cursor-pointer outline-none ${isDestructive ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}
                >
                  {isPending ? 'Processing...' : confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}
