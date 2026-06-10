"use client";

import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import {
	X,
	Plus,
	Trash,
	BookOpen,
	Clock3,
	Sparkles,
	Languages,
	Hash,
	Image as ImageIcon,
	AlignLeft,
	Tags,
	UploadCloud,
	RefreshCw,
	UserPen,
} from "lucide-react";
import {
	BookResponse,
	BookSubmissionResponse,
	GenreResponse,
	AuthorResponse,
	UpsertBookRequest
} from "@/types/book-management";
import AuthorRowSelect from "./AuthorRowSelect";
import GenreRowSelect from "./GenreRowSelect";
import { createBookAPI, updateBookAPI, approveSubmissionAPI, uploadBookCoverAPI } from "@/lib/api";
import { toast } from "react-hot-toast";

interface BookUpsertModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editData: BookResponse | null;
	approvalSourceData: BookSubmissionResponse | null;
}

export default function BookUpsertModal({
	isOpen,
	onClose,
	onSuccess,
	editData,
	approvalSourceData,
}: BookUpsertModalProps) {
	const [title, setTitle] = useState("");
	const [synopsis, setSynopsis] = useState("");
	const [coverImgUrl, setCoverImgUrl] = useState("");
	const [googleBookId, setGoogleBookId] = useState("");
	const [pubYear, setPubYear] = useState<number>(new Date().getFullYear());
	const [language, setLanguage] = useState("en");
	const [totalPages, setTotalPages] = useState<number>(0);

	// State Tambahan untuk Management Image Upload
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [authors, setAuthors] = useState<AuthorResponse[]>([
		{ id: 0, name: "" },
	]);
	// 🌟 State menampung badge genre terpilih (bisa genre lama dari DB atau genre baru ketikan admin)
	const [selectedGenres, setSelectedGenres] = useState<GenreResponse[]>([]);
	const [submitting, setSubmitting] = useState(false);

	const isEditMode = !!editData;
	const isApprovalMode = !!approvalSourceData;

	// Lock scroll body saat modal aktif
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	// Sinkronisasi data form saat modal dibuka / mode berubah
	useEffect(() => {
		setImageFile(null);
		setImagePreview(null);

		if (editData) {
			setTitle(editData.title);
			setSynopsis(editData.synopsis || "");
			setCoverImgUrl(editData.cover_img_url || "");
			setGoogleBookId(editData.google_book_id || "");
			setPubYear(editData.publication_year || new Date().getFullYear());
			setLanguage(editData.language || "en");
			setTotalPages(editData.total_pages || 0);

			// SINKRONISASI AUTHORS (EDIT MODE)
			if (editData.authors && editData.authors.length > 0) {
				setAuthors(
					editData.authors.map((a: any) => ({
						id: a.id ?? a.author_id ?? 0,
						name:
							typeof a === "object"
								? (a.name ?? a.author_name ?? "")
								: String(a),
					})),
				);
			} else {
				setAuthors([{ id: 0, name: "" }]);
			}

			// Mapping data genre bawaan buku saat masuk Edit Mode
			if (editData.genres) {
				const mapped: GenreResponse[] = editData.genres.map(
					(g: any) => {
						if (typeof g === "object") {
							const targetName = g.genre_name ?? g.name ?? "";
							return {
								id: g.genre_id ?? g.id ?? Date.now(),
								name: targetName,
								slug:
									g.slug ??
									targetName
										.toLowerCase()
										.replace(/\s+/g, "-"),
							};
						}
						const fallbackName = `${g}`;
						return {
							id: typeof g === "number" ? g : Date.now(),
							name: fallbackName,
							slug: fallbackName
								.toLowerCase()
								.replace(/\s+/g, "-"),
						};
					},
				);
				setSelectedGenres(mapped.filter((g) => g.name !== ""));
			} else {
				setSelectedGenres([]);
			}
		} else if (approvalSourceData) {
			setTitle(approvalSourceData.title);
			setSynopsis(approvalSourceData.synopsis || "");
			setCoverImgUrl(approvalSourceData.cover_img_url || "");
			setGoogleBookId("");
			setPubYear(new Date().getFullYear());
			setLanguage(approvalSourceData.language || "id");
			setTotalPages(approvalSourceData.total_pages || 0);

			// Sinkronisasi data authors bawaan submission
			if (
				approvalSourceData.authors &&
				approvalSourceData.authors.length > 0
			) {
				setAuthors(
					approvalSourceData.authors.map((a: any) => {
						if (typeof a === "object" && a !== null) {
							return {
								id: a.id ?? a.author_id ?? 0,
								name: a.name ?? a.author_name ?? "",
							};
						}
						return { id: 0, name: String(a || "") };
					}),
				);
			} else {
				setAuthors([{ id: 0, name: "" }]);
			}

			// Sinkronisasi data genres bawaan submission ke state badges modal
			if (approvalSourceData.genres) {
				setSelectedGenres(
					approvalSourceData.genres.map((g: any) => ({
						id: g.id || 0,
						name: g.name || "",
						slug: (g.name || "").toLowerCase().replace(/\s+/g, "-"),
					})),
				);
			} else {
				setSelectedGenres([]);
			}
		} else {
			setTitle("");
			setSynopsis("");
			setCoverImgUrl("");
			setGoogleBookId("");
			setPubYear(new Date().getFullYear());
			setLanguage("en");
			setTotalPages(0);
			setAuthors([{ id: 0, name: "" }]);
			setSelectedGenres([]);
		}
	}, [editData, approvalSourceData, isOpen]);

	if (!isOpen) return null;

	// HANDLE IMAGE CHANGE (FILE PICKER)
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				// Limit 2MB
				toast.error("Ukuran gambar terlalu besar. Maksimal 2MB.");
				return;
			}
			setImageFile(file);
			// Buat local URL untuk preview
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const handleRemovePreview = () => {
		setImageFile(null);
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleRemoveCurrentCover = () => {
		setCoverImgUrl("");
		handleRemovePreview();
	};

	const handleAddAuthorRow = () =>
		setAuthors([...authors, { id: 0, name: "" }]);

	const handleRemoveAuthorRow = (idx: number) =>
		setAuthors(authors.filter((_, i) => i !== idx));

	// Mengupdate nama atau mendeteksi jika admin memilih author yang sudah ada dari komponen anak
	const handleAuthorChange = (idx: number, newAuthor: AuthorResponse) => {
		const updated = [...authors];
		updated[idx] = newAuthor; // Mengganti seluruh objek
		setAuthors(updated);
	};

	const handleAddGenre = (genre: GenreResponse) => {
		const cleanedName = genre.name.trim();
		if (!cleanedName) return;

		// Cek apakah nama genre sudah pernah dimasukkan (case-insensitive)
		const isDuplicate = selectedGenres.some(
			(g) => g.name.toLowerCase() === cleanedName.toLowerCase(),
		);

		if (!isDuplicate) {
			// 🌟 Masukkan seluruh objek genre utuh (id, name, slug) agar memenuhi tipe GenreResponse
			setSelectedGenres([...selectedGenres, genre]);
		} else {
			toast.error(`Genre "${cleanedName}" sudah dipilih!`, {
				style: {
					background: "#09090B",
					color: "#F4F4F5",
					fontSize: "12px",
				},
			});
		}
	};

	// LOGIKA MENGHAPUS BADGE GENRE
	const handleRemoveGenre = (nameToRemove: string) => {
		setSelectedGenres(
			selectedGenres.filter((g) => g.name !== nameToRemove),
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const cleanedAuthors = authors
			.map((a) =>
				typeof a === "object" ? a.name.trim() : String(a).trim(),
			)
			.filter((a) => a !== "");

		const darkToastOptions = {
			style: {
				background: "#09090B",
				color: "#F4F4F5",
				border: "1px solid rgba(255,255,255,0.1)",
				fontSize: "12px",
				borderRadius: "12px",
				backdropFilter: "blur(8px)",
			},
			iconTheme: {
				primary: isEditMode ? "#3B82F6" : "#10B981",
				secondary: "#09090B",
			},
		};

		if (cleanedAuthors.length === 0) {
			toast.error(
				"Buku harus memiliki minimal 1 Penulis (Author).",
				darkToastOptions,
			);
			return;
		}

		if (selectedGenres.length === 0) {
			toast.error(
				"Silakan pilih atau buat minimal 1 Genre untuk buku ini.",
				darkToastOptions,
			);
			return;
		}

		setSubmitting(true);

		try {
			// 🌟 STEP 1: JIKA ADA FILE BINARY GAMBAR BARU, UPLOAD TERLEBIH DAHULU
			let finalCoverImgUrl = coverImgUrl || "";

			if (imageFile) {
				// Tampilkan loading toast khusus proses upload biner
				toast.loading("Mengunggah gambar sampul ke Cloudinary...", {
					id: "upload-cover-toast",
					style: darkToastOptions.style,
				});

				const uploadResult = await uploadBookCoverAPI(imageFile);
				finalCoverImgUrl = uploadResult.image_url; // Kunci URL hasil upload backend

				toast.dismiss("upload-cover-toast");
			}

			// STEP 2: PROSES SANITISASI DATA DATA SEPERTI BIASA
			const cleanGoogleBookId = (googleBookId || "").trim();
			const cleanPubYear =
				parseInt(String(pubYear).replace(/[^0-9]/g, "")) ||
				new Date().getFullYear();
			const cleanTotalPages =
				parseInt(String(totalPages).replace(/[^0-9]/g, "")) || 0;

			const authorIds: number[] = [];
			const newAuthorNames: string[] = [];

			authors.forEach((author) => {
				const trimmedName = (author?.name || "").trim();
				if (trimmedName === "") return;

				const numericId = Number(author.id);
				if (
					numericId &&
					!isNaN(numericId) &&
					numericId > 0 &&
					numericId < 1000000000
				) {
					authorIds.push(numericId);
				} else {
					newAuthorNames.push(trimmedName);
				}
			});

			const genreIds: number[] = [];
			const newGenreNames: string[] = [];

			selectedGenres.forEach((genre) => {
				const trimmedName = (genre?.name || "").trim();
				if (trimmedName === "") return;

				const numericId = Number(genre.id);
				if (
					numericId &&
					!isNaN(numericId) &&
					numericId > 0 &&
					numericId < 1000000000
				) {
					genreIds.push(numericId);
				} else {
					newGenreNames.push(trimmedName);
				}
			});

			// 🌟 STEP 3: STRUKTUR DATA PLAYLOAD SEKARANG MEMBAWA URL FIXED DARI CLOUDINARY
			const jsonPayload: UpsertBookRequest = {
				title: title.trim(),
				synopsis: synopsis.trim(),
				google_book_id:
					cleanGoogleBookId === "0" ? "" : cleanGoogleBookId,
				language: (language || "en").trim(),
				cover_img_url: finalCoverImgUrl, // Menyimpan URL string dari Cloudinary
				publication_year: cleanPubYear,
				total_pages: cleanTotalPages,
				author_ids: authorIds,
				new_author_names: newAuthorNames,
				genre_ids: genreIds,
				new_genre_names: newGenreNames,
			};

			// STEP 4: KONTROL DISPATCH DATA KE LAYER ENDPOINT YANG SESUAI
			if (editData) {
				await updateBookAPI(editData.book_id, jsonPayload);
				toast.success(
					"Rekaman data buku berhasil diperbarui!",
					darkToastOptions,
				);
			} else if (approvalSourceData) {
				await approveSubmissionAPI(
					approvalSourceData.book_submission_id,
					jsonPayload,
				);
				toast.success(
					"Pengajuan buku berhasil disetujui!",
					darkToastOptions,
				);
			} else {
				await createBookAPI(jsonPayload);
				toast.success(
					"Buku baru berhasil ditambahkan!",
					darkToastOptions,
				);
			}

			onSuccess();
			onClose();
		} catch (err: any) {
			// Bersihkan loading toast jika terjadi interupsi error di tengah jalan
			toast.dismiss("upload-cover-toast");
			console.error("Failed to commit book data sync", err);
			const backendMessage = err?.response?.data?.error || err?.message;
			toast.error(
				backendMessage
					? `Gagal menyimpan data: ${backendMessage}`
					: "Terjadi kesalahan sistem.",
				darkToastOptions,
			);
		} finally {
			setSubmitting(false);
		}
	};

	// Mengambil display source gambar aktif (prioritas preview baru -> data lama)
	const activeImageDisplay = imagePreview || coverImgUrl;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in-0 overflow-y-auto">
			<div className="relative w-full max-w-xl my-auto overflow-hidden rounded-3xl border border-white/10 bg-[#09090B]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
				<div
					className={clsx(
						"pointer-events-none absolute inset-0 transition-opacity duration-300",
						isEditMode
							? "bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.06),transparent_40%)]"
							: "bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_40%)]",
					)}
				/>

				{/* HEADER */}
				<div className="relative flex items-start justify-between border-b border-white/5 px-6 py-5 shrink-0">
					<div>
						<div
							className={clsx(
								"flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]",
								isEditMode
									? "text-blue-300/80"
									: "text-emerald-300/80",
							)}
						>
							<BookOpen size={12} />
							{isEditMode
								? "Catalog Registry Master"
								: "Submission Processing Pipeline"}
						</div>
						<h2 className="mt-3 text-lg font-semibold text-white">
							{editData
								? "Edit Book Metadata"
								: approvalSourceData
									? "Verify & Publish Submission"
									: "Add Direct Catalog Book"}
						</h2>
						<p className="mt-1 text-xs text-zinc-500">
							{isApprovalMode
								? `Originating from submission proposal ID: #${approvalSourceData?.book_submission_id}`
								: isEditMode
									? `Updating database record index ID: #${editData?.book_id}`
									: "Injecting a verified core literature master asset"}
						</p>
					</div>
					<button
						onClick={onClose}
						className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-500 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
					>
						<X size={15} />
					</button>
				</div>

				{/* FORM AREA */}
				<form
					onSubmit={handleSubmit}
					className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs"
				>
					{/* BOOK TITLE */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
							<Sparkles
								size={11}
								className={
									isEditMode
										? "text-blue-400/80"
										: "text-emerald-400/80"
								}
							/>
							Book Title *
						</label>
						<input
							type="text"
							required
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Beyond the Event Horizon"
							className={clsx(
								"w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-zinc-200 outline-none transition-all duration-300",
								isEditMode
									? "focus:border-blue-500/40 focus:bg-blue-500/[0.02]"
									: "focus:border-emerald-500/40 focus:bg-emerald-500/[0.02]",
							)}
						/>
					</div>

					{/* YEAR & LANGUAGE */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
								<Clock3 size={11} className="text-zinc-500" />{" "}
								Publication Year
							</label>
							<input
								type="number"
								value={pubYear}
								onChange={(e) =>
									setPubYear(Number(e.target.value))
								}
								className={clsx(
									"w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-zinc-200 outline-none transition-all duration-300",
									isEditMode
										? "focus:border-blue-500/40"
										: "focus:border-emerald-500/40",
								)}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
								<Languages
									size={11}
									className="text-zinc-500"
								/>{" "}
								Language
							</label>
							<input
								type="text"
								value={language}
								placeholder="en / id / ja"
								onChange={(e) => setLanguage(e.target.value)}
								className={clsx(
									"w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-zinc-200 outline-none transition-all duration-300",
									isEditMode
										? "focus:border-blue-500/40"
										: "focus:border-emerald-500/40",
								)}
							/>
						</div>
					</div>

					{/* PAGES & GOOGLE BOOK ID */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
								<Hash size={11} className="text-zinc-500" />{" "}
								Total Pages
							</label>
							<input
								type="number"
								value={totalPages}
								onChange={(e) =>
									setTotalPages(Number(e.target.value))
								}
								className={clsx(
									"w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-zinc-200 outline-none transition-all duration-300",
									isEditMode
										? "focus:border-blue-500/40"
										: "focus:border-emerald-500/40",
								)}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
								<Hash size={11} className="text-zinc-500" />{" "}
								Google Book ID
							</label>
							<input
								type="text"
								placeholder="Optional"
								value={googleBookId}
								onChange={(e) =>
									setGoogleBookId(e.target.value)
								}
								className={clsx(
									"w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-zinc-200 outline-none transition-all duration-300",
									isEditMode
										? "focus:border-blue-500/40"
										: "focus:border-emerald-500/40",
								)}
							/>
						</div>
					</div>

					{/* AUTHOR MANAGEMENT CARD */}
					<div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
						<div className="flex items-center justify-between">
							<div className="space-y-1.5">
								<label className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-bold flex items-center gap-1.5">
									<UserPen
										size={12}
										className={
											isEditMode
												? "text-blue-400/70"
												: "text-emerald-400/70"
										}
									/>
									Author Management *
								</label>
								<p className="text-[10px] text-zinc-500">
									Provide legal or pen names of creators to
									dynamically register into the system
								</p>
							</div>
							<button
								type="button"
								onClick={handleAddAuthorRow}
								className={clsx(
									"flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 text-[11px] font-medium transition-all duration-200",
									isEditMode
										? "bg-blue-500/10 text-blue-300 hover:border-blue-500/30 hover:bg-blue-500/20"
										: "bg-emerald-500/10 text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/20",
								)}
							>
								<Plus size={12} /> Add Creator
							</button>
						</div>
						<div className="space-y-2">
							{authors.map((auth, idx) => (
								<div
									key={idx}
									className="flex items-center gap-2 animate-in fade-in duration-150"
								>
									<AuthorRowSelect
										// 💡 Berikan fallback || "" untuk mengamankan jika .name bernilai undefined atau null
										value={auth?.name || ""}
										index={idx}
										placeholder={`Author #${idx + 1} Name`}
										isEditMode={isEditMode}
										allSelectedAuthors={authors.map(
											(a) => a?.name || "",
										)}
										onChange={(newName) => {
											handleAuthorChange(idx, {
												id: auth?.id || 0,
												name: newName,
											});
										}}
									/>
									{authors.length > 1 && (
										<button
											type="button"
											onClick={() =>
												handleRemoveAuthorRow(idx)
											}
											className="flex h-8 w-8 items-center justify-center shrink-0 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-400 transition-all duration-150 hover:bg-rose-500 hover:text-zinc-950"
										>
											<Trash size={12} />
										</button>
									)}
								</div>
							))}
						</div>
					</div>

					{/* 🌟 GENRE MANAGEMENT CARD (Mendukung Dynamic Insert & Anti Duplikat) */}
					<div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
						<label className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-bold flex items-center gap-1.5">
							<Tags
								size={12}
								className={
									isEditMode
										? "text-blue-400/70"
										: "text-emerald-400/70"
								}
							/>
							Genre Associations *
						</label>
						<p className="-mt-1.5 text-[10px] text-zinc-500">
							Search existing or type a new custom genre to
							dynamically append into system
						</p>

						<div className="pt-1">
							{/* 🌟 Berikan props data terpilih ke GenreRowSelect jika komponen itu memanfaatkannya */}
							<GenreRowSelect
								isEditMode={isEditMode}
								allSelectedGenreIds={
									selectedGenres
										.map((g) => g.id)
										.filter(Boolean) as number[]
								}
								onSelect={(genre) =>
									handleAddGenre({
										id: genre.id || 0, // Beri 0 jika genre baru buatan admin
										name: genre.name,
										slug:
											genre.slug ||
											genre.name
												.toLowerCase()
												.replace(/\s+/g, "-"),
									})
								}
							/>
						</div>

						{/* Badges container */}
						<div className="flex flex-wrap gap-2 pt-2">
							{selectedGenres.length === 0 ? (
								<span className="text-[10px] text-zinc-600 italic">
									No genres selected yet.
								</span>
							) : (
								selectedGenres.map((genre, idx) => (
									<div
										key={idx}
										className={clsx(
											"flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-medium transition-all duration-200 animate-in fade-in zoom-in-95 duration-150",
											isEditMode
												? "border-blue-500/30 bg-blue-500/10 text-blue-300"
												: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
										)}
									>
										<span>{genre.name}</span>
										<button
											type="button"
											onClick={() =>
												handleRemoveGenre(genre.name)
											}
											className="text-zinc-500 hover:text-white transition-colors duration-150"
										>
											<X size={10} />
										</button>
									</div>
								))
							)}
						</div>
					</div>

					{/* UPLOAD & PREVIEW IMAGE CONTAINER */}
					<div className="space-y-2">
						<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
							<ImageIcon size={11} className="text-zinc-500" />{" "}
							Book Cover Image
						</label>

						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							accept="image/*"
							onChange={handleImageChange}
						/>

						{activeImageDisplay ? (
							/* PREVIEW MODE (Mirip style blur background postingan bapak) */
							<div className="relative w-full h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 flex items-center justify-center group">
								{/* Layer 1: Blurred Background */}
								<img
									src={activeImageDisplay}
									alt="blur background"
									className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-30"
								/>
								{/* Layer 2: Main Image */}
								<img
									src={activeImageDisplay}
									alt="book cover preview"
									className="relative z-10 h-full max-w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
								/>
								{/* Overlay Actions */}
								<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center gap-3">
									<button
										type="button"
										onClick={() =>
											fileInputRef.current?.click()
										}
										className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] backdrop-blur-md border border-white/10 transition-all"
									>
										<RefreshCw size={12} /> Replace
									</button>
									<button
										type="button"
										onClick={
											imagePreview
												? handleRemovePreview
												: handleRemoveCurrentCover
										}
										className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[11px] backdrop-blur-md border border-rose-500/20 transition-all"
									>
										<Trash size={12} /> Remove
									</button>
								</div>
							</div>
						) : (
							/* UPLOAD BOX PLACEHOLDER (Jika tidak ada gambar) */
							<div
								onClick={() => fileInputRef.current?.click()}
								className={clsx(
									"w-full h-[140px] rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 group",
									isEditMode
										? "hover:border-blue-500/30"
										: "hover:border-emerald-500/30",
								)}
							>
								<div className="p-3 rounded-full bg-white/[0.02] border border-white/5 text-zinc-500 group-hover:text-zinc-300 transition-colors">
									<UploadCloud size={20} />
								</div>
								<div className="text-center">
									<p className="text-zinc-300 font-medium">
										Click to upload cover image
									</p>
									<p className="text-[10px] text-zinc-500 mt-0.5">
										Supports JPG, PNG or WEBP (Max 2MB)
									</p>
								</div>
							</div>
						)}
					</div>

					{/* SYNOPSIS */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
							<AlignLeft size={11} className="text-zinc-500" />{" "}
							Synopsis Narrative
						</label>
						<textarea
							rows={3}
							value={synopsis}
							placeholder="Write comprehensive plot outlines..."
							onChange={(e) => setSynopsis(e.target.value)}
							className={clsx(
								"w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-zinc-200 outline-none transition-all duration-300 resize-none",
								isEditMode
									? "focus:border-blue-500/40"
									: "focus:border-emerald-500/40",
							)}
						/>
					</div>
				</form>

				{/* FOOTER */}
				<div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-6 py-4 shrink-0">
					<div className="flex items-center gap-2 text-[10px] text-zinc-500">
						<Clock3
							size={12}
							className={
								isEditMode
									? "text-blue-400/70"
									: "text-emerald-400/70"
							}
						/>{" "}
						Changes pipeline directly syncs with database
					</div>
					<div className="flex items-center gap-3">
						<button
							type="button"
							disabled={submitting}
							onClick={onClose}
							className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-medium text-zinc-300 transition-all duration-200 hover:border-white/20 hover:text-white"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting}
							onClick={(e) => {
								const form = (e.target as HTMLElement)
									.closest("div")
									?.parentElement?.parentElement?.querySelector(
										"form",
									);
								if (form) form.requestSubmit();
							}}
							className={clsx(
								"h-9 rounded-xl px-4 text-xs font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-40",
								isEditMode
									? "bg-blue-400 hover:bg-blue-300 text-black font-bold"
									: "bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold",
							)}
						>
							{submitting
								? "Processing..."
								: editData
									? "Save Alterations"
									: "Publish to System DB"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
