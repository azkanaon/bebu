// src/app/(auth)/layout.tsx
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // flex-col untuk mobile, lg:flex-row untuk desktop
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#05070a] text-white">
      
      {/* Sisi Branding (Sekarang muncul di atas pada mobile) */}
      <div className="relative flex w-full flex-col items-center justify-center py-12 lg:w-1/2 lg:py-0">
        
        {/* Background Mesh Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center px-6">
          {/* Logo Section */}
          <div className="mb-4 flex items-center gap-3 lg:mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.5)] lg:h-16 lg:w-16">
                {/* SVG Logo atau Huruf */}
                <span className="text-2xl font-bold italic lg:text-4xl">B</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-5xl">BeBu</h1>
          </div>

          {/* Text Section */}
          <h2 className="mb-2 text-2xl font-semibold lg:text-4xl">Welcome to BeBu</h2>
          <p className="max-w-[300px] text-sm text-gray-400 lg:max-w-none lg:text-lg">
            Discuss and explore books with others
          </p>
        </div>
      </div>

      {/* Sisi Form (Anak/Children) */}
      <div className="flex w-full items-start justify-center px-4 pb-12 lg:w-1/2 lg:items-center lg:pb-0">
        <div className="w-full max-w-[450px]">
          {children}
        </div>
      </div>
      
    </div>
  );
}