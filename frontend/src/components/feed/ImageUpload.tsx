"use client";

import { useRef } from "react";

export default function ImageUpload({
	file,
	setFile,
}: {
	file: File | null;
	setFile: (f: File | null) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = (f: File) => {
		if (!f.type.startsWith("image/")) return;
		setFile(f);
	};

	return (
		<div
			onClick={() => inputRef.current?.click()}
			onDragOver={(e) => e.preventDefault()}
			onDrop={(e) => {
				e.preventDefault();
				const f = e.dataTransfer.files[0];
				if (f) handleFile(f);
			}}
			className="
				border-2 border-dashed border-gray-600
				rounded-xl p-4 text-center cursor-pointer
				hover:border-blue-500 transition
			"
		>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				onChange={(e) => {
					const f = e.target.files?.[0];
					if (f) handleFile(f);
				}}
			/>

			{file ? (
				<div className="relative">
					<img
						src={URL.createObjectURL(file)}
						className="rounded-lg max-h-48 mx-auto"
					/>

					<button
						onClick={(e) => {
							e.stopPropagation();
							setFile(null);
						}}
						className="absolute top-2 right-2 bg-black/60 px-2 rounded"
					>
						✕
					</button>
				</div>
			) : (
				<p className="text-sm text-gray-400">
					Click or drag image here
				</p>
			)}
		</div>
	);
}
