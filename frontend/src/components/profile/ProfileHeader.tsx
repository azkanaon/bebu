'use client'

import { motion } from 'framer-motion'

export default function ProfileHeader() {
  return (
    <div className="bg-[#0B1220] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
      {/* Avatar */}
      <div className="flex justify-center sm:justify-start">
        <img
          src="https://i.pravatar.cc/150"
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1">
        {/* Top */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-white">
              Jonathan Miller
            </h1>
            <p className="text-sm text-gray-400">@jonathareads</p>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm text-gray-300">
            <div>
              <span className="font-semibold text-white">12.5K</span>
              <p className="text-xs text-gray-400">Followers</p>
            </div>
            <div>
              <span className="font-semibold text-white">320</span>
              <p className="text-xs text-gray-400">Following</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {/* FOLLOW BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-my px-4 py-1.5 rounded-md text-sm w-full sm:w-auto cursor-pointer hover:bg-ym"
          >
            Follow
          </motion.button>

          {/* EDIT PROFILE BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="border border-white/20 px-4 py-1.5 rounded-md text-sm w-full sm:w-auto cursor-pointer hover:bg-white/10"
          >
            Edit Profile
          </motion.button>
        </div>

        {/* Bio */}
        <p className="text-sm text-gray-300 mt-3">
          Passionate about analyzing sci-fi & fantasy novels. Avid reader and
          aspiring author.
        </p>
      </div>
    </div>
  )
}
