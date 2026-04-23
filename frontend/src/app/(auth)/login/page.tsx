'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthActions } from '@/hooks/useAuthActions'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState('') // Email or Username
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuthActions() // Pakai hook buatan kita

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login({ email_or_username: identifier, password })
  }

  return (
    <div className="w-full rounded-2xl bg-auth-form p-6 shadow-2xl ring-1 ring-white/5 sm:p-8 lg:my-10">
      {/* Tabs Custom */}
      <div className="mb-8 flex w-fit items-center gap-1 rounded-xl bg-[#161922] p-1.5">
        <button className="rounded-lg bg-[#040c18] px-8 py-2.5 text-sm font-medium text-font-button transition-all shadow-sm">
          Login
        </button>
        <Link
          href="/register"
          className="rounded-lg px-8 py-2.5 text-sm font-medium text-gray-400 transition-all hover:text-white"
        >
          Sign Up
        </Link>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}
        {/* Input Groups */}
        <div className="space-y-1.5">
          <input
            type="text"
            placeholder="Email / Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-4 text-sm text-white/80 font-medium outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-brand-dark placeholder:text-gray-500 placeholder:font-medium"
          />
        </div>

        {/* Password Group */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] pl-4 pr-12 text-sm text-white/80 font-medium outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-brand-dark placeholder:text-gray-500 placeholder:font-medium"
            />
            {/* Tombol Show/Hide Password */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Forgot Password di luar/bawah input */}
          <div className="flex justify-end">
            <Link
              href="/reset-password"
              className="text-xs font-medium text-font-button hover:text-blue-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-my text-sm font-semibold text-font-button transition-all cursor-pointer hover:bg-ym hover:scale-[1.01] active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? 'Authenticating...' : 'Log in'}
        </button>

        {/* Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#0f1117] px-3 text-[10px] uppercase tracking-wider text-gray-500">
              Or, continue with
            </span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/5 cursor-pointer bg-[#161922] text-sm font-medium transition-all hover:bg-white/[0.05]"
          >
            <span className="text-lg">G</span> Google
          </button>
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/5 cursor-pointer bg-[#161922] text-sm font-medium transition-all hover:bg-white/[0.05]"
          >
            <span className="font-bold">f</span> Facebook
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-bold text-font-button hover:underline"
          >
            Sign up
          </Link>
        </div>
      </form>

      {/* Footer Links */}
      <footer className="mt-10 flex justify-center gap-8 border-t border-white/5 pt-6 text-[10px] font-medium text-gray-500 uppercase tracking-widest">
        <Link href="#" className="hover:text-white transition-colors">
          Privacy
        </Link>
        <Link href="#" className="hover:text-white transition-colors">
          Terms
        </Link>
        <Link href="#" className="hover:text-white transition-colors">
          Help
        </Link>
      </footer>
    </div>
  )
}
