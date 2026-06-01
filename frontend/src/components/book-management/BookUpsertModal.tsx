"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
	BookResponse,
	BookSubmissionResponse,
	GenreResponse,
} from "@/types/book-management";
import AuthorRowSelect from "./AuthorRowSelect";
import GenreRowSelect from "./GenreRowSelect";
import { createBookAPI, updateBookAPI, approveSubmissionAPI } from "@/lib/api";
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

	const [authors, setAuthors] = useState<string[]>([""]);

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
		if (editData) {
			setTitle(editData.title);
			setSynopsis(editData.synopsis || "");
			setCoverImgUrl(editData.cover_img_url || "");
			setGoogleBookId(editData.google_book_id || "");
			setPubYear(editData.publication_year || new Date().getFullYear());
			setLanguage(editData.language || "en");
			setTotalPages(editData.total_pages || 0);
			setAuthors(editData.authors.length ? editData.authors : [""]);

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
						// Fallback jika datanya mentah berupa array primitive/number/string
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
			setAuthors(
				approvalSourceData.authors.length
					? approvalSourceData.authors
					: [""],
			);
			setSelectedGenres([]);
		} else {
			setTitle("");
			setSynopsis("");
			setCoverImgUrl("");
			setGoogleBookId("");
			setPubYear(new Date().getFullYear());
			setLanguage("en");
			setTotalPages(0);
			setAuthors([""]);
			setSelectedGenres([]);
		}
	}, [editData, approvalSourceData, isOpen]);

	if (!isOpen) return null;

	const handleAddAuthorRow = () => setAuthors([...authors, ""]);
	const handleRemoveAuthorRow = (idx: number) =>
		setAuthors(authors.filter((_, i) => i !== idx));
	const handleAuthorChange = (idx: number, val: string) => {
		const updated = [...authors];
		updated[idx] = val;
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
			.map((a) => a.trim())
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

		const uniqueAuthors = new Set(
			cleanedAuthors.map((a) => a.toLowerCase()),
		);
		if (uniqueAuthors.size !== cleanedAuthors.length) {
			toast.error(
				"Ditemukan nama penulis yang duplikat di dalam form.",
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

		const payload: any = {
			title,
			synopsis,
			cover_img_url: coverImgUrl,
			google_book_id: googleBookId || "",
			publication_year: Number(pubYear),
			language,
			total_pages: Number(totalPages),
			author_names: cleanedAuthors,
			genre_names: selectedGenres.map((g) => g.name),
		};

		try {
			if (editData) {
				await updateBookAPI(editData.book_id, payload);
				toast.success(
					"Rekaman data buku berhasil diperbarui!",
					darkToastOptions,
				);
			} else if (approvalSourceData) {
				await approveSubmissionAPI(
					approvalSourceData.book_submission_id,
					payload,
				);
				toast.success(
					"Pengajuan buku berhasil disetujui!",
					darkToastOptions,
				);
			} else {
				await createBookAPI(payload);
				toast.success(
					"Buku baru berhasil ditambahkan!",
					darkToastOptions,
				);
			}
			onSuccess();
			onClose();
		} catch (err: any) {
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
							<div>
								<p className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-bold">
									Author Management
								</p>
								<p className="text-[10px] text-zinc-500">
									Provide legal or pen names of creators
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
										value={auth}
										index={idx}
										placeholder={`Author #${idx + 1} Name`}
										isEditMode={isEditMode}
										allSelectedAuthors={authors}
										onChange={(newName) =>
											handleAuthorChange(idx, newName)
										}
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
										id: genre.id,
										name: genre.name,
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

					{/* COVER IMAGE */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
							<ImageIcon size={11} className="text-zinc-500" />{" "}
							Cover Image URL
						</label>
						<input
							type="text"
							value={coverImgUrl}
							placeholder="https://..."
							onChange={(e) => setCoverImgUrl(e.target.value)}
							className={clsx(
								"w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-zinc-200 outline-none transition-all duration-300",
								isEditMode
									? "focus:border-blue-500/40"
									: "focus:border-emerald-500/40",
							)}
						/>
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
