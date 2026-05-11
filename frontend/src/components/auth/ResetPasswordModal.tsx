'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, X, Eye, EyeOff } from 'lucide-react'
import ClientPortal from '../ClientPortal'

// IMPORT HOOK BARU KITA
import { useForgotPassword } from '@/api/auth/useForgotPassword'
import { useResetPassword } from '@/api/auth/useResetPassword'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
}: ResetPasswordModalProps) {
  // 1. Inisialisasi Hook Forgot Password (Kirim Kode)
  const {
    mutate: sendCode,
    isPending: isSendingCode,
    error: forgotError,
  } = useForgotPassword()

  // 2. Inisialisasi Hook Reset Password (Submit Password Baru)
  const {
    mutate: submitReset,
    isPending: isResetting,
    error: resetError,
  } = useResetPassword()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPolicyError, setShowPolicyError] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Gabungkan Loading: Jika salah satu sedang jalan, maka global loading true
  const isLoading = isSendingCode || isResetting

  // Ambil pesan error (prioritaskan error dari API, jika tidak ada pakai localError)
  const displayError = resetError?.message || forgotError?.message || localError

  const isKirimDisabled = !email || isLoading
  const isSubmitDisabled =
    !email || !password || !confirmPassword || !code || isLoading

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setCode('')
    setIsAgreed(false)
    setShowPass(false)
    setShowPolicyError(false)
    setLocalError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // FUNGSI UNTUK KIRIM KODE (FORGOT PASSWORD)
  const handleSendCode = () => {
    setLocalError(null)
    sendCode(email)
  }

  // FUNGSI UNTUK SUBMIT (RESET PASSWORD)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!isAgreed) {
      setShowPolicyError(true)
      setTimeout(() => setShowPolicyError(false), 3000)
      return
    }
    if (password !== confirmPassword) {
      setLocalError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    // Panggil reset password
    submitReset(
      { token: code, new_password: password },
      {
        onSuccess: () => {
          handleClose() // Tutup modal hanya jika API sukses
        },
      },
    )
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <ClientPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="pointer-events-auto relative w-full max-w-[500px] rounded-[2rem] bg-[#0B1220] p-6 sm:p-10 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/5 text-gray-400"
                >
                  <ChevronLeft size={22} />
                </button>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Reset Password
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/5 text-gray-400"
                >
                  <X size={22} />
                </button>
              </div>

              {/* TAMPILKAN ERROR */}
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium text-center"
                >
                  {displayError}
                </motion.div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-5 text-sm text-white/80 outline-none focus:border-blue-500/50"
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-5 pr-14 text-sm text-white/80 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-5 pr-14 text-sm text-white/80 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-12 flex-1 rounded-xl border border-white/5 bg-[#161922] px-5 text-sm text-white/80 outline-none"
                  />
                  {/* TOMBOL KIRIM KODE */}
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isKirimDisabled}
                    className="px-5 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500 hover:text-white disabled:opacity-30"
                  >
                    {isSendingCode ? 'Sending...' : 'Send Code'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-500 shadow-lg disabled:opacity-40 cursor-pointer"
                >
                  {isResetting ? 'Processing...' : 'Reset Password'}
                </button>

                {/* Privacy Policy Checkbox */}
                <div className="relative flex gap-4 pt-6 border-t border-white/5 mt-4">
                  <AnimatePresence>
                    {showPolicyError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        // Kita gunakan -top-14 agar lebih tinggi dan tidak tertutup jari/kursor
                        className="absolute -top-4 -left-3 z-[200] w-full"
                      >
                        <div className="relative bg-red-500 text-white text-[11px] px-4 py-2 rounded-xl font-bold shadow-2xl w-fit">
                          Please accept our privacy policy
                          {/* Segitiga Tooltip */}
                          <div className="absolute -bottom-1 left-4 w-3 h-3 bg-red-500 rotate-45"></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-white/10 bg-transparent text-blue-600 cursor-pointer accent-blue-500"
                  />
                  <p className="text-[10px] leading-relaxed text-gray-500">
                    I am at least 13 years old. By proceeding, I agree to the{' '}
                    <Link href="#" className="text-blue-400 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" className="text-blue-400 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}
