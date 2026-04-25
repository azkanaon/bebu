'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, X, Eye, EyeOff } from 'lucide-react'
import { useAuthActions } from '@/hooks/useAuthActions'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
}: ResetPasswordModalProps) {
  const { forgotPassword, resetPassword, isLoading, error, setError } =
    useAuthActions()

  // States Form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')

  // UI States
  const [showPass, setShowPass] = useState(false)
  const [showPolicyError, setShowPolicyError] = useState(false) // Untuk Bubble Chat

  const [showConfirm, setShowConfirm] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)

  // Logika Disable
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
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSendCode = async () => {
    if (email) await forgotPassword(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Cek Kebijakan Privasi
    if (!isAgreed) {
      setShowPolicyError(true)
      setTimeout(() => setShowPolicyError(false), 3000)
      return
    }

    // 2. Validasi Konfirmasi Password (Frontend Only)
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.') // Menggunakan setError dari hook
      return
    }

    // 3. Kirim sesuai payload Backend
    await resetPassword(
      {
        token: code, // 'code' di state dipetakan ke 'token' di API
        new_password: password, // 'password' di state dipetakan ke 'new_password' di API
      },
      onClose,
    )
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
    }

    // Cleanup listener saat modal tertutup atau komponen unmount
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  // Jika modal tidak terbuka, jangan render apapun
  if (!isOpen) return null

  return (
    // Backdrop / Overlay
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Container Modal */}
      <div
        className="relative w-full max-w-[550px] rounded-3xl bg-auth-form p-6 shadow-2xl ring-1 ring-white/10 sm:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar transition-all scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/5 text-gray-400 cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-white text-center">
            Atur Ulang Kata Sandi
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/5 text-gray-400 cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-5 text-sm text-white/80 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-brand-dark"
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Setel kata sandi"
                className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-5 pr-14 text-sm text-white/80 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-brand-dark"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 px-1">
              8-20 karakter dari minimal 2 kategori: huruf, angka, karakter
              khusus.
            </p>
          </div>

          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Konfirmasi kata sandi"
              className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-5 pr-14 text-sm text-white/80 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-brand-dark"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Kode verifikasi"
              onChange={(e) => setCode(e.target.value)}
              className="h-12 flex-1 rounded-xl border border-white/5 bg-[#161922] px-5 text-sm text-white/80 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-brand-dark"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isKirimDisabled}
              className="px-6 h-12 rounded-xl bg-my/20 border border-my/30 text-font-button text-sm font-bold hover:bg-font-button hover:text-brand-dark transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.01]"
            >
              {isLoading ? '...' : 'Kirim Kode'}
            </button>
          </div>

          {/* Ingat Saya (Lingkaran) */}
          <label className="flex items-center gap-3 cursor-pointer group w-fit">
            <div className="relative flex items-center justify-center h-5 w-5 rounded-full border-2 border-gray-600 group-hover:border-blue-500 transition-all">
              <input
                type="checkbox"
                className="absolute opacity-0 peer cursor-pointer"
              />
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500 scale-0 peer-checked:scale-100 transition-transform"></div>
            </div>
            <span className="text-sm text-gray-300">Ingat saya</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="h-12 w-full rounded-xl bg-my text-base font-bold text-font-button hover:bg-ym transition-all shadow-lg shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
          >
            {isLoading ? 'Memproses...' : 'Atur Ulang Kata Sandi'}
          </button>

          {/* Legal Agreement */}
          <div className="relative flex gap-4 pt-4 border-t border-white/5">
            {/* --- BUBBLE CHAT ERROR --- */}
            {showPolicyError && (
              <div className="absolute -top-12 left-0 z-50 animate-bounce">
                <div className="relative bg-red-500 text-white text-[10px] px-3 py-2 rounded-lg font-bold shadow-xl">
                  Silakan centang kebijakan privasi terlebih dahulu
                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-red-500 rotate-45"></div>
                </div>
              </div>
            )}

            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-600 bg-transparent text-blue-600 cursor-pointer"
            />
            <p className="text-[11px] leading-relaxed text-gray-400">
              Saya telah berusia 13 tahun ke atas. Dengan login, Anda telah
              mengetahui dan menyetujui bahwa Anda telah membaca dan menyetujui
              untuk terikat dengan{' '}
              <Link href="#" className="text-blue-500 hover:underline">
                Syarat Layanan
              </Link>{' '}
              dan{' '}
              <Link href="#" className="text-blue-500 hover:underline">
                Kebijakan Privasi
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
