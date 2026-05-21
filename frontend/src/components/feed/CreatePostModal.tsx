"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { usePostModal } from "@/stores/postModal";
import BookSelect from "./BookSelect";
import StarRating from "./StarRating";
import ImageUpload from "./ImageUpload";
import CategorySelect from "./CategorySelect";
import { createPost } from "@/lib/api";
import { CategoryResponse } from "@/types/post";

const tabs = [
	{ key: "review", label: "Review" },
	{ key: "analysis", label: "Analysis" },
] as const;

type Book = {
	id: number;
	title: string;
};

export default function CreatePostModal() {
	const { isOpen, type, initialBook, open, close } = usePostModal();

	const [book, setBook] = useState<Book | null>(initialBook);
	const [rating, setRating] = useState(0);
	const [file, setFile] = useState<File | null>(null);
	const [categories, setCategories] = useState<CategoryResponse[]>([]);
	const [text, setText] = useState("");
	const maxChar = 100;

	const [isLoading, setIsLoading] = useState(false);

	const isDisabled = !book || !text || (type === "review" && rating === 0);

	const handleCloseModal = () => {
		setBook(null);
		setRating(0);
		setFile(null);
		setCategories([]);
		setText("");
		close(); // Panggil close dari Zustand store
	};

	const authStorage =
		typeof window !== "undefined"
			? localStorage.getItem("bebu-auth-storage")
			: null;
	const parsedStorage = authStorage ? JSON.parse(authStorage) : null;
	const user = parsedStorage?.state?.user;

	useEffect(() => {
		if (isOpen && initialBook) {
			setBook(initialBook);
		} else if (!isOpen) {
			setBook(null);
		}
	}, [isOpen, initialBook]);

	// ESC close
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleCloseModal();
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, []);

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 z-[9999] flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					{/* Overlay */}
					<motion.div
						className="absolute inset-0 bg-black/60 backdrop-blur-md"
						onClick={handleCloseModal}
					/>

					{/* Modal */}
					<motion.div
						initial={{ scale: 0.92, opacity: 0, y: 30 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.92, opacity: 0 }}
						transition={{
							type: "spring",
							stiffness: 220,
							damping: 18,
						}}
						className="
relative z-10 w-full max-w-lg
rounded-3xl p-6
bg-gradient-to-b from-[#0f172a] to-[#020617]
border border-white/10
shadow-[0_25px_80px_rgba(0,0,0,0.8)]
backdrop-blur-xl
"
					>
						{/* Header */}
						<motion.div
							initial={{ opacity: 0, y: -12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, ease: "easeOut" }}
							className="mb-5"
						>
							<div className="flex items-center justify-between">
								{/* LEFT */}
								<div className="flex items-center gap-3">
									{/* 🔥 Dynamic Icon */}
									<motion.div
										key={type}
										initial={{
											scale: 0.8,
											rotate: -10,
											opacity: 0,
										}}
										animate={{
											scale: 1,
											rotate: 0,
											opacity: 1,
										}}
										transition={{
											type: "spring",
											stiffness: 250,
										}}
										className={`
w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
${
	type === "review"
		? "bg-gradient-to-br from-yellow-400 to-orange-500"
		: "bg-gradient-to-br from-blue-500 to-purple-500"
}
`}
									>
										<span className="text-white text-lg">
											{type === "review" ? "⭐" : "🧠"}
										</span>
									</motion.div>

									<div>
										<h2 className="text-lg font-semibold text-white">
											Create Post
										</h2>

										{/* 🔥 Dynamic subtitle */}
										<motion.p
											key={type}
											initial={{ opacity: 0, y: 5 }}
											animate={{ opacity: 1, y: 0 }}
											className="text-xs text-gray-400"
										>
											Share your{" "}
											<span
												className={
													type === "review"
														? "text-yellow-400"
														: "text-purple-400"
												}
											>
												{type === "review"
													? "review"
													: "analysis"}
											</span>
										</motion.p>
									</div>
								</div>

								{/* RIGHT (Close Button) */}
								<motion.button
									onClick={handleCloseModal}
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.9 }}
									className="
relative w-9 h-9 rounded-lg
bg-white/5
border border-white/10
hover:border-white/20
flex items-center justify-center
transition
"
								>
									{/* Glow hover */}
									<div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 hover:opacity-100 transition" />

									<span className="relative text-gray-300">
										✕
									</span>
								</motion.button>
							</div>

							{/* 🔥 Divider subtle */}
							<motion.div
								initial={{ scaleX: 0, opacity: 0 }}
								animate={{ scaleX: 1, opacity: 1 }}
								transition={{ duration: 0.4, delay: 0.1 }}
								className="h-px mt-4 bg-gradient-to-r from-transparent via-white/20 to-transparent origin-left"
							/>
						</motion.div>

						{/* Tabs */}
						<LayoutGroup>
							<div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-full">
								{tabs.map((t) => {
									const isActive = type === t.key;

									const isReview = t.key === "review";

									const activeBg = isReview
										? "bg-gradient-to-r from-yellow-400 to-orange-500"
										: "bg-gradient-to-r from-purple-500 to-indigo-500";

									const inactiveText = isReview
										? "text-yellow-400"
										: "text-purple-400";

									const hoverBg = isReview
										? "hover:bg-yellow-500/10"
										: "hover:bg-purple-500/10";

									const glow = isReview
										? "shadow-[0_0_20px_rgba(255,200,0,0.25)]"
										: "shadow-[0_0_20px_rgba(168,85,247,0.25)]";

									return (
										<button
											key={t.key}
											onClick={() =>
												open(t.key, initialBook)
											}
											className={`
relative flex-1 py-2 text-sm font-medium rounded-full overflow-hidden
transition
${!isActive ? hoverBg : ""}
`}
										>
											{/* 🔥 Active pill */}
											{isActive && (
												<motion.div
													layoutId="tab-pill"
													className={`
absolute inset-0 rounded-full
${activeBg}
${glow}
`}
													transition={{
														type: "spring",
														stiffness: 300,
														damping: 25,
													}}
												/>
											)}

											{/* 🔥 Subtle inner highlight */}
											{isActive && (
												<div className="absolute inset-0 rounded-full bg-white/10" />
											)}

											{/* 🔥 Text */}
											<span
												className={`relative z-10 transition ${
													isActive
														? "text-white"
														: `${inactiveText} opacity-70`
												}`}
											>
												{t.label}
											</span>
										</button>
									);
								})}
							</div>
						</LayoutGroup>

						{/* Form */}
						<form
							onSubmit={async (e) => {
								e.preventDefault();

								if (isDisabled || isLoading) return;

								const finalBookId = initialBook?.id || book?.id;

								if (!finalBookId) {
									console.error("ID Buku tidak ditemukan!");
									return;
								}

								try {
									setIsLoading(true);

									await createPost({
										user_id: user?.id,
										book_id: finalBookId,
										description: text,
										post_type: type,
										rating,
										categories:
											type === "analysis"
												? categories
														.map((c) =>
															c.name.trim(),
														)
														.filter(
															(name) =>
																name.length > 0,
														)
												: [],
										file, // 🔥 ini pengganti img_url
									});

									handleCloseModal(); // tutup modal setelah sukses

									// optional: reset state
									setText("");
									setBook(null);
									setRating(0);
									setFile(null);
								} catch (err) {
									console.error(err);
								} finally {
									setIsLoading(false);
								}
							}}
							className="space-y-5"
						>
							<BookSelect
								value={book}
								onChange={setBook}
								defaultBook={initialBook} // 👈 Pasang initialBook dari zustand ke sini
							/>

							{/* Textarea */}
							<div className="relative">
								<motion.textarea
									value={text}
									onChange={(e) => {
										setText(e.target.value);
										e.target.style.height = "auto";
										e.target.style.height =
											e.target.scrollHeight + "px";
									}}
									whileFocus={{ scale: 1.01 }}
									placeholder="Write your thoughts..."
									maxLength={maxChar}
									className="
w-full p-4 pr-16 rounded-xl
bg-white/5
border border-white/10
focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
transition resize-none overflow-hidden
"
								/>

								{/* Counter INSIDE */}
								<motion.div
									className={`
absolute bottom-3 right-3 text-xs px-2 py-1 rounded-md
backdrop-blur-md border
transition
${
	text.length > maxChar * 0.8
		? "bg-red-500/10 text-red-400 border-red-500/20"
		: "bg-white/5 text-gray-400 border-white/10"
}
`}
									animate={{
										scale:
											text.length > maxChar * 0.9
												? [1, 1.1, 1]
												: 1,
									}}
									transition={{ duration: 0.2 }}
								>
									{text.length}/{maxChar}
								</motion.div>
							</div>

							{/* Conditional */}
							<AnimatePresence mode="wait">
								{type === "review" ? (
									<motion.div
										key="review"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
									>
										<StarRating
											value={rating}
											onChange={setRating}
										/>
									</motion.div>
								) : (
									<motion.div
										key="analysis"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className="space-y-6"
									>
										<CategorySelect
											value={categories}
											onChange={setCategories}
										/>

										<ImageUpload
											file={file}
											setFile={setFile}
										/>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Submit */}
							<motion.button
								type="submit"
								disabled={isDisabled || isLoading}
								whileHover={
									!isDisabled && !isLoading
										? { scale: 1.03, y: -1 }
										: {}
								}
								whileTap={
									!isDisabled && !isLoading
										? { scale: 0.97, y: 1 }
										: {}
								}
								className={`
relative w-full py-3 rounded-xl font-semibold overflow-hidden
transition-all duration-200
${isDisabled ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "text-white"}
`}
							>
								{/* 🔥 Gradient (tetap hidup saat loading) */}
								{!isDisabled && (
									<motion.div
										className="absolute inset-0 rounded-xl"
										initial={{ opacity: 0.9 }}
										animate={{
											background: [
												"linear-gradient(90deg, #3b82f6, #8b5cf6)",
												"linear-gradient(90deg, #6366f1, #a855f7)",
												"linear-gradient(90deg, #3b82f6, #8b5cf6)",
											],
										}}
										transition={{
											duration: 4,
											repeat: Infinity,
										}}
									/>
								)}

								{/* 🔥 Glow */}
								{!isDisabled && (
									<div className="absolute inset-0 rounded-xl blur-xl opacity-40 bg-gradient-to-r from-blue-500 to-purple-500" />
								)}

								{/* 🔥 Shimmer (hanya saat loading) */}
								{isLoading && (
									<motion.div
										className="absolute inset-0"
										initial={{ x: "-100%" }}
										animate={{ x: "100%" }}
										transition={{
											repeat: Infinity,
											duration: 1.2,
											ease: "linear",
										}}
										style={{
											background:
												"linear-gradient(120deg, transparent, rgba(255,255,255,0.25), transparent)",
										}}
									/>
								)}

								{/* 🔥 Content */}
								<span className="relative z-10 flex items-center justify-center gap-2">
									{isLoading ? (
										<>
											<span>Posting...</span>

											{/* Dot loader */}
											<div className="flex gap-1">
												{[0, 1, 2].map((i) => (
													<motion.span
														key={i}
														className="w-1.5 h-1.5 bg-white rounded-full"
														animate={{
															opacity: [
																0.3, 1, 0.3,
															],
														}}
														transition={{
															duration: 1,
															repeat: Infinity,
															delay: i * 0.2,
														}}
													/>
												))}
											</div>
										</>
									) : (
										<>
											Post
											<motion.span
												animate={{ x: [0, 4, 0] }}
												transition={{
													duration: 1.5,
													repeat: Infinity,
												}}
											>
												→
											</motion.span>
										</>
									)}
								</span>
							</motion.button>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
}
