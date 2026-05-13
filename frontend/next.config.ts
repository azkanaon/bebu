import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos', // ✅ tambahin ini
      },
      {
        protocol: 'https',
        hostname: 'example.com', // ✅ tambahin ini
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com', // ✅ Tambahkan ini
        pathname: '/7.x/**', // Opsional: agar lebih spesifik
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Mengizinkan semua gambar dari Cloudinary
      },
    ],
  },
}

export default nextConfig
