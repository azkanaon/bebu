import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, X, Send, Check, Loader2 } from "lucide-react";
import {
	sharePostAPI,
	getRecentRecipientsAPI,
	searchUsersAPI,
} from "@/lib/api";
import { UserSearchResponse } from "@/types/post";
import debounce from "lodash/debounce";

interface ShareModalProps {
	isOpen: boolean;
	onClose: () => void;
	postId: number;
	onShareSuccess: (count: number) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
	isOpen,
	onClose,
	postId,
	onShareSuccess,
}) => {
	const [mounted, setMounted] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [recentUsers, setRecentUsers] = useState<UserSearchResponse[]>([]);
	const [displayUsers, setDisplayUsers] = useState<UserSearchResponse[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
	const [optionalMessage, setOptionalMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [isSearching, setIsSearching] = useState(false);

	// Initial mounting
	useEffect(() => {
		const frame = requestAnimationFrame(() => setMounted(true));
		return () => cancelAnimationFrame(frame);
	}, []);

	const debouncedSearch = useMemo(
		() =>
			debounce(async (query: string) => {
				if (!query.trim()) {
					setDisplayUsers(recentUsers);
					setIsSearching(false);
					return;
				}

				setIsSearching(true);
				try {
					const res = await searchUsersAPI(query);
					setDisplayUsers(res.data ?? []);
				} catch (error) {
					console.error("Search failed", error);
				} finally {
					setIsSearching(false);
				}
			}, 500),
		[recentUsers],
	);

	useEffect(() => {
		debouncedSearch(searchQuery);
		// Cleanup debounce saat searchQuery berubah atau unmount
		return () => debouncedSearch.cancel();
	}, [searchQuery, debouncedSearch]);

	// Body scroll lock
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

	useEffect(() => {
		let isSubscribed = true;

		const fetchData = async () => {
			if (isOpen) {
				try {
					const res = await getRecentRecipientsAPI();
					if (isSubscribed) {
						const data = res.data ?? [];
						setRecentUsers(data);
						setDisplayUsers(data);
					}
				} catch (error) {
					console.error("Failed to fetch recent users", error);
				}
			}
		};

		fetchData();

		return () => {
			isSubscribed = false;
		};
	}, [isOpen]);

	const handleClose = () => {
		setSearchQuery("");
		setSelectedUsers([]);
		setOptionalMessage("");
		onClose();
	};

	const toggleUser = (userId: number) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const handleSend = async () => {
		if (selectedUsers.length === 0) return;
		setLoading(true);
		try {
			const response = await sharePostAPI({
				post_id: postId,
				receiver_ids: selectedUsers,
				message: optionalMessage,
			});

			console.log("API Response:", response);

			// Panggil callback dengan jumlah user yang berhasil dikirimi (dari BE)
			onShareSuccess(response.count);

			handleClose();
		} catch (error) {
			console.error("Failed to share", error);
		} finally {
			setLoading(false);
		}
	};

	if (!mounted || !isOpen) return null;

	const modalContent = (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-sm"
				onClick={onClose}
			/>

			<div className="relative bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
				{/* Header */}
				<div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
					<h3 className="text-white font-semibold">
						Bagikan Postingan
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition"
					>
						<X size={20} />
					</button>
				</div>

				{/* Search Bar */}
				<div className="p-4">
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
							size={16}
						/>
						<input
							type="text"
							placeholder="Cari teman..."
							className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-purple-500 transition"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						{isSearching && (
							<div className="absolute right-3 top-1/2 -translate-y-1/2">
								<Loader2
									className="animate-spin text-purple-500"
									size={16}
								/>
							</div>
						)}
					</div>
				</div>

				{/* List Container */}
				<div className="flex-1 max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
					{!searchQuery && displayUsers?.length > 0 && (
						<p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-3 mb-2">
							Terakhir dikirim
						</p>
					)}

					<div className="space-y-1">
						{displayUsers.length > 0 ? (
							displayUsers.map((user) => (
								<div
									key={user.id}
									onClick={() => toggleUser(user.id)}
									className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 cursor-pointer transition group"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-800">
											<img
												src={
													user.avatar ||
													"/default-avatar.png"
												}
												alt={user.username}
												className="w-full h-full object-cover"
											/>
										</div>
										<div className="flex flex-col">
											<span className="text-sm font-medium text-gray-200">
												{user.display_name ||
													user.username}
											</span>
											<span className="text-xs text-gray-500">
												@{user.username}
											</span>
										</div>
									</div>
									<div
										className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
											selectedUsers.includes(user.id)
												? "bg-purple-500 border-purple-500"
												: "border-gray-600 group-hover:border-gray-400"
										}`}
									>
										{selectedUsers.includes(user.id) && (
											<Check
												size={12}
												className="text-white"
											/>
										)}
									</div>
								</div>
							))
						) : (
							<div className="py-10 text-center text-gray-500 text-sm">
								{isSearching
									? "Mencari..."
									: "User tidak ditemukan"}
							</div>
						)}
					</div>
				</div>

				{/* Footer & Message */}
				<div className="p-4 border-t border-gray-800 bg-gray-900/50">
					<textarea
						placeholder="Tulis pesan (opsional)..."
						className="custom-scrollbar w-full bg-gray-800/50 border border-gray-700 rounded-lg p-2 text-sm text-gray-300 resize-none focus:outline-none focus:border-gray-600 transition"
						rows={2}
						value={optionalMessage}
						onChange={(e) => setOptionalMessage(e.target.value)}
					/>

					<button
						disabled={selectedUsers.length === 0 || loading}
						onClick={handleSend}
						className={`w-full mt-3 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
							selectedUsers.length > 0
								? "bg-purple-600 text-white hover:bg-purple-500"
								: "bg-gray-800 text-gray-500 cursor-not-allowed"
						}`}
					>
						{loading ? (
							<Loader2 className="animate-spin" size={18} />
						) : (
							<>
								<Send size={16} />
								Kirim{" "}
								{selectedUsers.length > 0 &&
									`(${selectedUsers.length})`}
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};

export default ShareModal;
