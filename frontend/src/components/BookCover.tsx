"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { DEFAULT_BOOK_COVER } from "@/lib/constants";

interface BookCoverProps {
	src?: string | null;
	title?: string;
	fill?: boolean;
	width?: number;
	height?: number;
	className?: string;
	priority?: boolean;
	sizes?: string;
}

export default function BookCover({
	src,
	title = "Book Cover",
	fill = false,
	width,
	height,
	className = "",
	priority = false,
	sizes,
}: BookCoverProps) {
	const [imgSrc, setImgSrc] = useState<string>(DEFAULT_BOOK_COVER);

	// Sinkronisasi state jika src dari backend berubah
	useEffect(() => {
		if (src) {
			setImgSrc(src);
		} else {
			setImgSrc(DEFAULT_BOOK_COVER);
		}
	}, [src]);

	return (
		<Image
			src={imgSrc}
			alt={title}
			className={`object-cover ${className}`}
			unoptimized
			priority={priority}
			sizes={sizes}
			// Menangani kasus jika URL dari database broken/404
			onError={() => {
				setImgSrc(DEFAULT_BOOK_COVER);
			}}
			// Jika fill=true, jangan berikan properti width & height
			{
				...(fill
					? { fill: true }
					: { width: width || 120, height: height || 160 }) // Nilai default jika tidak pakai fill
			}
		/>
	);
}
