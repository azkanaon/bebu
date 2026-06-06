'use client'

import { AnimatePresence, motion, Reorder } from 'framer-motion' // Tambahkan Reorder
import {
  X,
  Camera,
  MapPin,
  Trash2,
  Plus,
  GripVertical,
  Globe,
  MessageSquare,
  UserPen,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import ClientPortal from '../ClientPortal'
import Image from 'next/image'
import { useUpdateProfile } from '@/api/profile/useUpdateProfile'
import { base64ToBlob } from '@/lib/utils'
import { getCroppedImg } from '@/lib/cropImage'
import Cropper, { Area } from 'react-easy-crop'
import { usePlatforms } from '@/api/platforms/usePlatform'

type SocialLinkItem = {
  platformId: number
  url: string
  tempId: string // Untuk key React saat render list
}

type Props = {
  open: boolean
  onClose: () => void
  initialData: any // Sesuaikan dengan tipe profile kamu
}

export default function EditProfileModal({
  open,
  onClose,
  initialData,
}: Props) {
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // console.log(initialData)
  const { data: platforms, isLoading: platformsLoading } = usePlatforms()

  // State Form
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [gender, setGender] = useState('Prefer not to say')
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [allowDm, setAllowDm] = useState(false)
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false)
  useEffect(() => {
    // Hanya jalankan pengisian data jika modal dalam keadaan OPEN
    if (open && initialData && platforms) {
      setDisplayName(initialData.profile?.displayName || '')
      setBio(initialData.profile?.bio || '')
      setLocation(initialData.profile?.location || '')
      setGender(initialData.profile?.gender || 'Prefer not to say')

      // Privacy Logic: isPublic adalah kebalikan dari isPrivateAccount
      setIsPublic(initialData.settings?.isProfilePublic ?? true)

      // Jika di backend ada field ini, masukkan juga
      setAllowDm(initialData.settings?.allowDmFromPublic ?? true)

      const mappedLinks =
        initialData.socialLinks?.map((link: any) => {
          // Cari ID platform berdasarkan slug jika backend hanya kirim slug
          const platformMatch = platforms.find(
            (p: any) => p.slug === link.platformSlug,
          )

          return {
            platformId:
              link.platformId || platformMatch?.id || platforms[0]?.id || 1,
            url: link.url || '',
            tempId: Math.random().toString(),
          }
        }) || []

      setSocialLinks(mappedLinks)
    }
  }, [open, initialData, platforms])

  const addSocialLink = () => {
    const defaultPlatformId = platforms?.[0]?.id || 1
    setSocialLinks([
      ...socialLinks,
      {
        platformId: defaultPlatformId,
        url: '',
        tempId: Math.random().toString(),
      },
    ])
  }

  // State Image & Crop
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedBlob, setSelectedBlob] = useState<Blob | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // FIX ERROR TS: Definisikan tipe Area | null
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // ... (onFileSelect & onCropConfirm tetap sama)
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.readAsDataURL(e.target.files[0])
      reader.onload = () => setImageToCrop(reader.result as string)
    }
  }

  const onCropConfirm = async () => {
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedBase64 = await getCroppedImg(
          imageToCrop,
          croppedAreaPixels,
        )
        const blob = base64ToBlob(croppedBase64)
        setSelectedBlob(blob)
        setPreviewUrl(croppedBase64)
        setImageToCrop(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // REVISI 1: MENGGUNAKAN FORM DATA
  const handleSave = () => {
    const formData = new FormData()

    // Append File Gambar jika ada
    if (isRemovingPhoto) {
      // Beritahu backend untuk menghapus foto (set ke "")
      formData.append('remove_avatar', 'true')
    } else if (selectedBlob) {
      formData.append('avatar', selectedBlob, 'profile.jpg')
    }

    // Append data teks
    formData.append('display_name', displayName)
    formData.append('bio', bio)
    formData.append('location', location)
    formData.append('gender', gender)
    formData.append('is_profile_public', String(isPublic))
    formData.append('allow_dm_from_public', String(allowDm))

    // Append Social Links sebagai JSON String
    const linksForBackend = socialLinks.map(({ platformId, url }) => ({
      platformId,
      url,
    }))
    formData.append('social_links', JSON.stringify(linksForBackend))

    updateProfile(formData, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <ClientPortal>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-100 bg-black backdrop-blur-sm"
          />

          {/* MODAL WRAPPER */}
          <div className="fixed inset-0 z-110 flex items-center justify-center p-0 md:p-4 pointer-events-none">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="pointer-events-auto relative w-full h-full md:h-auto md:max-h-[90vh] md:w-130 bg-[#0B1220] md:rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
                <div className="flex gap-2">
                  <UserPen size={20} className="text-gray-400" />
                  <h2 className="text-base font-bold tracking-tight uppercase text-gray-400">
                    Edit Profile
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 outline-none cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FORM CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* PHOTO SECTION (SIMPLIFIED) */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={onFileSelect}
                  />

                  <div className="relative group">
                    <div
                      className="relative w-28 h-28 rounded-full border-4 border-white/5 ring-2 ring-blue-500/20 overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image
                        // Jika sedang mode "Hapus", tampilkan gambar default
                        src={
                          isRemovingPhoto
                            ? '/default-avatar.png'
                            : previewUrl ||
                              initialData?.profile?.avatarUrl ||
                              '/default-avatar.png'
                        }
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRemovingPhoto(false)
                        fileInputRef.current?.click()
                      }}
                      className="absolute bottom-1 right-1 p-2 bg-blue-700 rounded-full border-4 border-[#0B1220] hover:bg-blue-900 transition-colors shadow-lg outline-none cursor-pointer"
                    >
                      <Camera size={14} className="text-white" />
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRemovingPhoto(false)
                        fileInputRef.current?.click()
                      }}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest outline-none cursor-pointer"
                    >
                      Change
                    </button>

                    {/* Tampilkan tombol Remove jika ada foto yang bisa dihapus */}
                    {(initialData?.profile?.avatarUrl || previewUrl) &&
                      !isRemovingPhoto && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsRemovingPhoto(true)
                            setSelectedBlob(null)
                            setPreviewUrl(null)
                          }}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest outline-none"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                </div>

                {/* ACCOUNT INFO */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
                    Account
                  </h3>
                  <div className="space-y-4">
                    <InputGroup
                      label="Username"
                      value={`@${initialData?.username}`}
                      disabled
                    />
                    <InputGroup
                      label="Name"
                      value={displayName}
                      onChange={setDisplayName}
                    />
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase ml-1">
                        Bio
                      </label>
                      <div className="relative">
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value.slice(0, 80))}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 min-h-24 resize-none transition-all outline-none"
                        />
                        <span className="absolute bottom-3 right-3 text-[10px] text-gray-600 font-mono">
                          {bio.length}/80
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PERSONAL INFO */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
                    Personal Info
                  </h3>
                  <div className="space-y-2 text-center sm:text-left">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase ml-1">
                      Gender
                    </label>
                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                      {['Male', 'Female', 'Prefer not to say'].map((item) => (
                        <button
                          key={item}
                          onClick={() => setGender(item)}
                          className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all outline-none ring-0 ${gender === item ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Location Input Group */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase ml-1">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-11 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SOCIAL LINKS (Tetap pake Reorder karena fungsional) */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
                    Social Links
                  </h3>
                  <Reorder.Group
                    axis="y"
                    values={socialLinks}
                    onReorder={setSocialLinks}
                    className="space-y-3"
                  >
                    {socialLinks.map((link) => (
                      <Reorder.Item
                        key={link.tempId}
                        value={link}
                        className="flex items-center gap-2 bg-[#0B1220]"
                      >
                        <div className="text-gray-600 cursor-grab active:cursor-grabbing p-1">
                          <GripVertical size={18} />
                        </div>

                        {/* DROP DOWNS MENGGUNAKAN DATA API */}
                        <select
                          value={link.platformId} // Ikat ke state
                          onChange={(e) => {
                            const newId = Number(e.target.value)
                            setSocialLinks(
                              socialLinks.map((l) =>
                                l.tempId === link.tempId
                                  ? { ...l, platformId: newId }
                                  : l,
                              ),
                            )
                          }}
                          className="bg-white/5 border border-white/5 rounded-xl px-2 py-2.5 text-[10px] outline-none focus:border-blue-500/50 appearance-none min-w-[100px]"
                        >
                          {platformsLoading ? (
                            <option>Loading...</option>
                          ) : (
                            platforms?.map((p: any) => (
                              <option
                                key={p.id}
                                value={p.id}
                                className="bg-[#0B1220]"
                              >
                                {p.name}
                              </option>
                            ))
                          )}
                        </select>

                        <input
                          type="text"
                          value={link.url}
                          placeholder="URL"
                          className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500/50"
                          onChange={(e) => {
                            setSocialLinks(
                              socialLinks.map((l) =>
                                l.tempId === link.tempId
                                  ? { ...l, url: e.target.value }
                                  : l,
                              ),
                            )
                          }}
                        />

                        <button
                          onClick={() =>
                            setSocialLinks(
                              socialLinks.filter(
                                (l) => l.tempId !== link.tempId,
                              ),
                            )
                          }
                          className="text-gray-500 hover:text-red-400 p-2 outline-none"
                        >
                          <Trash2 size={16} />
                        </button>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                  <button
                    onClick={addSocialLink}
                    className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold uppercase text-gray-500 hover:text-blue-400 flex items-center justify-center gap-2 outline-none"
                  >
                    <Plus size={14} /> Add Social Link
                  </button>
                </div>

                {/* PRIVACY */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
                    Privacy & Settings
                  </h3>
                  <div className="space-y-3">
                    <ToggleRow
                      icon={<Globe size={18} />}
                      label="Public Profile"
                      active={isPublic}
                      onToggle={() => setIsPublic(!isPublic)}
                    />
                    <ToggleRow
                      icon={<MessageSquare size={18} />}
                      label="Allow DM From Public"
                      active={allowDm}
                      onToggle={() => setAllowDm(!allowDm)}
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-5 border-t border-white/10 flex gap-3 shrink-0">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white bg-white/5 rounded-xl outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 outline-none"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* POPUP CROP (FULL SCREEN OVERLAY) */}
          <AnimatePresence>
            {imageToCrop && (
              <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
                {/* Backdrop Hitam Pekat khusus Crop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setImageToCrop(null)}
                  className="absolute inset-0 bg-black/90"
                />

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative w-[90vw] h-[70vh] md:w-[30vw] md:h-[55vh] bg-[#0B1220] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0B1220] z-10">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
                      Crop Image
                    </h2>
                    <button
                      onClick={() => setImageToCrop(null)}
                      className="p-1 text-gray-500 hover:text-white outline-none"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="relative flex-1 bg-black">
                    <Cropper
                      image={imageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={1 / 1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(_, pixels) =>
                        setCroppedAreaPixels(pixels)
                      }
                    />
                  </div>

                  <div className="p-5 border-t border-white/10 bg-[#0B1220] space-y-4 z-10">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        Zoom
                      </span>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 accent-blue-500 rounded-lg appearance-none cursor-pointer outline-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setImageToCrop(null)}
                        className="flex-1 py-2.5 text-[10px] font-bold uppercase text-gray-500 bg-white/5 rounded-xl outline-none"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onCropConfirm}
                        className="flex-1 py-2.5 text-[10px] font-bold uppercase bg-blue-600 rounded-xl outline-none transition-all active:scale-95"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </ClientPortal>
      )}
    </AnimatePresence>
  )
}

// SUB-COMPONENTS UNTUK KEBERSIHAN KODE
function InputGroup({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: any) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold text-gray-500 uppercase ml-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}

function ToggleRow({ icon, label, active, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-2xl group">
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-lg transition-colors ${active ? 'bg-blue-600/10 text-blue-500' : 'bg-white/5 text-gray-500'}`}
        >
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${active ? 'bg-blue-600' : 'bg-white/10'}`}
      >
        <motion.div
          animate={{ x: active ? 22 : 4 }}
          className="absolute top-1 w-3 h-3 bg-white rounded-full"
        />
      </button>
    </div>
  )
}
