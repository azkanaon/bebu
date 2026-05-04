import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "picsum.photos", // ✅ tambahin ini
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com", // ✅ Tambahkan ini
        pathname: "/7.x/**",          // Opsional: agar lebih spesifik
      },
    ],
  },
};

export default nextConfig;
