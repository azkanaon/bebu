'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useChangePassword } from '@/api/auth/useChangePassword'
import { useAuthStore } from '@/stores/useAuthStore'

export default function ChangePasswordClient() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { mutate: changePassword, isPending } = useChangePassword()

  // State Form
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // State Visibility (Toggle Mata)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    changePassword(
      {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      {
        onSuccess: () => {
          // Reset form jika sukses
          setOldPassword('')
          setNewPassword('')
          setConfirmPassword('')
          // Redirect balik ke profil setelah jeda sebentar
          setTimeout(() => router.push(`/${user?.username}`), 1500)
        },
      },
    )
  }

  return (
    <div className="max-w-[600px] mx-auto py-6 sm:py-10 px-4 sm:px-0">
      {/* 1. BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors cursor-pointer group"
      >
        <ChevronLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="text-sm font-bold uppercase tracking-widest">
          Back
        </span>
      </button>

      {/* 2. HEADER SECTION */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 mb-4 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Change Password</h1>
        <p className="text-sm text-slate-500 max-w-[320px]">
          Update your password regularly to keep your BeBu account secure.
        </p>
      </div>

      {/* 3. FORM CARD */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-[#0B1220]/60 border border-white/10 rounded-[2.5rem] p-6 sm:p-10 space-y-6 shadow-2xl"
      >
        <PasswordField
          label="Current Password"
          value={oldPassword}
          onChange={setOldPassword}
          show={showOld}
          onToggle={() => setShowOld(!showOld)}
          placeholder="Enter your old password"
        />

        <div className="h-px w-full bg-white/5" />

        <PasswordField
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
          placeholder="Min. 8 characters"
        />

        <PasswordField
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
          placeholder="Repeat your new password"
        />

        {/* 4. ACTION BUTTONS */}
        <div className="pt-4 flex flex-col gap-3">
          <button
            type="submit"
            disabled={
              isPending || !oldPassword || !newPassword || !confirmPassword
            }
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Update Password'
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </motion.form>

      {/* 5. FOOTER NOTE */}
      <p className="mt-10 text-center text-[10px] text-slate-600 font-medium uppercase tracking-widest px-10 leading-relaxed">
        Changing your password will not log you out from your current session on
        this device.
      </p>
    </div>
  )
}

// --- SUB-COMPONENT: PASSWORD FIELD (Strictly Typed) ---
interface PasswordFieldProps {
  label: string
  value: string
  onChange: (val: string) => void
  show: boolean
  onToggle: () => void
  placeholder: string
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: PasswordFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 ml-1">
        <Lock size={12} className="text-slate-500" />
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {label}
        </label>
      </div>
      <div className="relative group">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 pr-12 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer outline-none"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}
