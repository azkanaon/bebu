"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { DEFAULT_AVATAR } from "@/lib/constants";

// Definisikan tipe data props yang dibutuhkan
interface UserAvatarProps {
	user?: {
		avatar_url?: string | null;
		display_name?: string | null;
	} | null;
	size?: number; // Membuat ukuran avatar dinamis
	className?: string; // Untuk custom styling tambahan dari luar
}

export default function UserAvatar({
	user,
	size = 40,
	className = "",
}: UserAvatarProps) {
	// Pindahkan logika penentuan src ke dalam state agar bisa di-update jika terjadi error (404)
	const [imgSrc, setImgSrc] = useState<string>(DEFAULT_AVATAR);

	useEffect(() => {
		if (user?.avatar_url) {
			setImgSrc(user.avatar_url);
		} else {
			// Langsung arahkan ke avatar default lokal milikmu
			setImgSrc(DEFAULT_AVATAR);
		}
	}, [user?.avatar_url]);

	return (
		<Image
			src={imgSrc}
			alt={user?.display_name || "User Profile"}
			width={size}
			height={size}
			// Menggabungkan style default dengan style tambahan dari props
			className={`rounded-full object-cover border-2 border-white/30 ${className}`}
			unoptimized
			// Jika URL gambar bermasalah/broken link, otomatis fallback ke default-avatar lokal
			onError={() => {
				setImgSrc(DEFAULT_AVATAR);
			}}
		/>
	);
}
