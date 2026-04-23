'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Camera, AlertCircle, X, Check } from 'lucide-react'

import { getCroppedImg } from '@/lib/cropImage'
import { useAuthActions } from '@/hooks/useAuthActions'
import { base64ToBlob } from '@/lib/utils'

export default function RegisterPage() {
  const { register, isLoading, error } = useAuthActions()

  // States untuk visibilitas password
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // States untuk Form Data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    display_name: '',
    bio: '',
    gender: '',
  })

  const checkPasswordMatch = (confirm_password: string, password: string) => {
    if (confirm_password.length > 0) {
      if (confirm_password !== password) {
        return 'Passwords do not match.'
      } else {
        return ''
      }
    } else {
      return ''
    }
  }

  const confirmError = checkPasswordMatch(
    formData.confirm_password,
    formData.password,
  )

  const getPasswordError = (password: string) => {
    if (!password) return ''

    const hasNumber = /\d/.test(password)
    const hasLetter = /[a-zA-Z]/.test(password)
    const isLongEnough = password.length >= 8

    if (!isLongEnough || !hasNumber || !hasLetter) {
      return 'Password must be 8+ characters with letters & numbers.'
    }

    return ''
  }

  const passError = getPasswordError(formData.password)

  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Fungsi saat memilih file
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageToCrop(reader.result as string)
        setIsModalOpen(true) // Buka modal cropping
      }
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = useCallback((_croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const showCroppedImage = async () => {
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels)
        setImagePreview(croppedImage) // Set hasil crop ke preview form
        setIsModalOpen(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Validasi Password Match
    if (formData.password !== formData.confirm_password) {
      alert('Passwords do not match!')
      return
    }

    // 2. Konversi Image (Jika ada)
    let avatarBlob: Blob | null = null
    if (imagePreview) {
      avatarBlob = base64ToBlob(imagePreview)
    }

    // 3. Kirim ke Hook Register
    await register({
      ...formData,
      avatar: avatarBlob as Blob, // Kirim biner ke service
    })
  }

  return (
    <div className="w-full rounded-2xl bg-auth-form p-6 shadow-2xl ring-1 ring-white/5 sm:p-8 h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
      {/* Tabs Custom */}
      <div className="mb-8 flex w-fit items-center gap-1 rounded-xl bg-[#161922] p-1.5">
        <Link
          href="/login"
          className="rounded-lg px-8 py-2.5 text-sm font-medium text-gray-400 transition-all hover:text-white"
        >
          Login
        </Link>
        <button className="rounded-lg bg-[#040c18] px-8 py-2.5 text-sm font-medium text-font-button transition-all shadow-sm">
          Sign Up
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <div className="text-red-500 text-xs mb-4">{error}</div>}
        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full border-2 border-dashed border-white/20 bg-[#161922] overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-500/50">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Default Profile"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="text-gray-500" size={32} />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Modal Cropping Image */}
          {isModalOpen && imageToCrop && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="relative w-full max-w-[500px] rounded-2xl bg-auth-form p-6 shadow-2xl ring-1 ring-white/10">
                <h3 className="mb-4 text-center font-bold text-white">
                  Adjust Profile Picture
                </h3>

                {/* Area Cropper */}
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-black">
                  <Cropper
                    image={imageToCrop}
                    crop={crop}
                    zoom={zoom}
                    aspect={1 / 1} // Paksa rasio 1:1
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                {/* Slider Zoom */}
                <div className="mt-6 flex flex-col gap-2">
                  <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest text-center">
                    Zoom
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#161922] accent-blue-600"
                  />
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <X size={18} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={showCroppedImage}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-my py-3 text-sm font-semibold text-font-button hover:bg-ym transition-all cursor-pointer"
                  >
                    <Check size={18} /> Crop & Save
                  </button>
                </div>
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Profile Picture (1:1)
          </p>
        </div>

        {/* Username & Display Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Username"
            className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-4 text-sm text-white/80 font-medium outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-brand-dark placeholder:text-gray-500"
            onChange={(e) =>
              setFormData({
                ...formData,
                username: e.target.value,
              })
            }
          />
          <input
            type="text"
            placeholder="Display Name"
            className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-4 text-sm text-white/80 font-medium outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-brand-dark placeholder:text-gray-500"
            onChange={(e) =>
              setFormData({
                ...formData,
                display_name: e.target.value,
              })
            }
          />
        </div>

        {/* Email */}
        <input
          type="email"
          placeholder="Email Address"
          className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-4 text-sm text-white/80 font-medium outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-brand-dark placeholder:text-gray-500"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        {/* Password Group */}
        <div className="space-y-1">
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              className={`h-12 w-full rounded-xl border bg-[#161922] pl-4 pr-12 text-sm text-white/80 font-medium outline-none transition-all focus:ring-1 focus:ring-brand-dark placeholder:text-gray-500 ${passError ? 'border-red-500/50' : 'border-white/5'}`}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passError && (
            <div className="flex items-center gap-1.5 px-1 text-[11px] font-medium text-red-400">
              <AlertCircle size={12} /> {passError}
            </div>
          )}
        </div>

        {/* Confirm Password Group */}
        <div className="space-y-1">
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm Password"
              className={`h-12 w-full rounded-xl border bg-[#161922] pl-4 pr-12 text-sm text-white/80 font-medium outline-none transition-all focus:ring-1 focus:ring-brand-dark placeholder:text-gray-500 ${confirmError ? 'border-red-500/50' : 'border-white/5'}`}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirm_password: e.target.value,
                })
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmError && (
            <div className="flex items-center gap-1.5 px-1 text-[11px] font-medium text-red-400">
              <AlertCircle size={12} /> {confirmError}
            </div>
          )}
        </div>

        {/* Gender Selection */}
        <div className="space-y-1.5">
          <select
            className="h-12 w-full rounded-xl border border-white/5 bg-[#161922] px-4 text-sm text-white/80 font-medium outline-none transition-all focus:ring-1 focus:ring-brand-dark cursor-pointer appearance-none"
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
            value={formData.gender}
          >
            <option value="" disabled className="text-gray-500">
              Select Gender
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="rather_not_say">Rather Not Say</option>
          </select>
        </div>

        {/* Bio */}
        <textarea
          placeholder="Tell us about yourself (Bio)"
          rows={3}
          className="w-full rounded-xl border border-white/5 bg-[#161922] p-4 text-sm text-white/80 font-medium outline-none transition-all focus:ring-1 focus:ring-brand-dark placeholder:text-gray-500 resize-none"
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        />

        <button
          type="submit"
          disabled={!!passError || !!confirmError}
          className="h-12 w-full rounded-xl bg-my text-sm font-semibold text-font-button transition-all cursor-pointer hover:bg-ym hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-bold text-font-button hover:underline"
          >
            Login here
          </Link>
        </div>
      </form>
    </div>
  )
}
