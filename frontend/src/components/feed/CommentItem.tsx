import React, { useState, useEffect } from "react";
import {
	MoreVertical,
	Trash2,
	Flag,
	Heart,
	AlertTriangle,
	Lock,
} from "lucide-react";
import { CommentType } from "@/types/post";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";

interface CommentItemProps {
	comment: CommentType;
	postId: number;
	currentUserId: string | undefined;
	isReply?: boolean;
	depth?: number;
	handleDelete: (commentId: number, postId: number) => void;
	handleToggleLike: (commentId: number) => void;
	handleReplyClick: (comment: CommentType) => void;
	setReportTarget: (
		target: { id: number; type: "post" | "comment" } | null,
	) => void;
	onFocusThread: (comment: CommentType) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
	comment,
	postId,
	currentUserId,
	isReply = false,
	depth = 0,
	handleDelete,
	handleToggleLike,
	handleReplyClick,
	setReportTarget,
	onFocusThread,
}) => {
	const [showMore, setShowMore] = React.useState(false);
	const [openMenuId, setOpenMenuId] = useState<number | null>(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

	// State untuk melacak status suspensi user
	const [isSuspended, setIsSuspended] = useState(false);

	// Ambil status user dari localStorage
	useEffect(() => {
		try {
			const authStorage = localStorage.getItem("bebu-auth-storage");
			if (authStorage) {
				const parsedStorage = JSON.parse(authStorage);
				const user = parsedStorage?.state?.user;
				if (user?.status === "suspended") {
					setIsSuspended(true);
				}
			}
		} catch (error) {
			console.error("Gagal membaca status auth di CommentItem:", error);
		}
	}, []);

	return (
		<div className={`flex flex-col gap-3 ${isReply ? "pl-6" : ""}`}>
			{/* Konten Komentar */}
			<div className="flex gap-3 items-start relative group/item">
				<UserAvatar
					user={{
						avatar_url:
							comment.avatar,
						display_name: comment.username,
					}}
					size={36} // Menggantikan w-9 h-9 (9 * 4px = 36px)
					className="ring-1 ring-gray-800 object-cover"
				/>
				<div className="flex-1">
					<div className="bg-gray-900/30 border border-gray-800/50 rounded-2xl p-3 relative group-hover:bg-gray-900 transition-colors">
						<div className="flex justify-between items-center mb-1 pr-6">
							<div className="flex items-center gap-2">
								<Link
									href={`/${comment.username}`}
									className="
                                        text-sm font-bold text-gray-200
                                        hover:text-blue-300
                                        transition-colors duration-150 
                                        cursor-pointer inline-block
                                    "
								>
									@{comment.username}
								</Link>
								<span className="text-[11px] text-gray-600">
									{timeAgo(comment.created_at)}
								</span>
							</div>

							{/* Action Menu (Titik Tiga) */}
							<div className="absolute right-3 top-3 group/menu">
								<button className="p-1 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-gray-800">
									<MoreVertical size={16} />
								</button>

								<div className="invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 absolute right-0 mt-1 w-44 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 transition-all duration-200 overflow-hidden">
									{String(comment.user_public_id) ===
									String(currentUserId) ? (
										confirmDeleteId === comment.id ? (
											// Tampilan Konfirmasi (Inline)
											<div className="w-44 p-3 space-y-2 border-t border-white/5">
												<div className="flex items-start gap-2">
													<div className="mt-[1px] text-red-400">
														<AlertTriangle
															size={13}
															strokeWidth={2.3}
														/>
													</div>
													<div>
														<p className="text-xs font-medium text-gray-200">
															Delete Comment?
														</p>
														<p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
															This is Permanent
															Action!
														</p>
													</div>
												</div>
												<div className="flex justify-end gap-1">
													<button
														onClick={() =>
															setConfirmDeleteId(
																null,
															)
														}
														className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-white transition-colors"
													>
														Cancel
													</button>
													<button
														onClick={() => {
															handleDelete(
																comment.id,
																postId,
															);
															setConfirmDeleteId(
																null,
															);
															setOpenMenuId(null);
														}}
														className="px-2.5 py-1 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
													>
														Delete
													</button>
												</div>
											</div>
										) : (
											// Tombol Hapus Awal
											<button
												onClick={(e) => {
													e.stopPropagation();
													setConfirmDeleteId(
														comment.id,
													);
												}}
												className="w-full px-4 py-2 text-left text-[11px] text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
											>
												<Trash2 size={12} /> Delete
											</button>
										)
									) : (
										/* 🔥 ADAPTASI GAYA MERAH TRANSMISI JIKA USER DI-SUSPEND */
										<button
											disabled={isSuspended}
											onClick={() => {
												if (isSuspended) return; // Proteksi berlapis
												setReportTarget({
													id: comment.id,
													type: "comment",
												});
												setOpenMenuId(null);
											}}
											className={`w-full px-4 py-2 text-left text-[11px] flex items-center gap-2 transition-colors justify-between ${
												isSuspended
													? "text-red-400/50 bg-red-950/10 cursor-not-allowed"
													: "text-gray-400 hover:bg-gray-800 hover:text-red-400"
											}`}
										>
											<div className="flex items-center gap-2">
												<Flag size={12} />
												<span>
													{isSuspended
														? "Report Locked"
														: "Report"}
												</span>
											</div>
											{isSuspended && (
												<Lock
													size={12}
													className="text-red-400/40 ml-auto"
												/>
											)}
										</button>
									)}
								</div>
							</div>
						</div>
						<p className="text-sm text-gray-400 leading-relaxed">
							{comment.comment}
						</p>
					</div>

					{/* Tombol Suka & Balas */}
					<div className="flex gap-4 mt-2 ml-2">
						<button
							onClick={() => handleToggleLike(comment.id)}
							className={`flex items-center gap-1 text-[10px] transition-all duration-200 font-bold uppercase tracking-wider ${
								comment.is_liked
									? "text-red-500 scale-110"
									: "text-gray-500 hover:text-red-400"
							}`}
						>
							<Heart
								size={12}
								fill={
									comment.is_liked ? "currentColor" : "none"
								}
								className={
									comment.is_liked ? "animate-pulse" : ""
								}
							/>
							{comment.likeCount > 0 ? (
								<span>{comment.likeCount}</span>
							) : (
								"Like"
							)}
						</button>
						<button
							onClick={() => handleReplyClick(comment)}
							disabled={isSuspended}
							className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition ${
								isSuspended
									? "text-gray-700 cursor-not-allowed"
									: "text-gray-500 hover:text-blue-400"
							}`}
						>
							Reply
						</button>
					</div>
				</div>
			</div>

			{/* REKURSI: Menampilkan Balasan dari Balasan (Nested) */}
			{comment.replies && comment.replies.length > 0 && (
				<div className="flex flex-col relative mt-2 ml-[18px]">
					<div className="flex flex-col gap-4 border-l-[1.5px] border-gray-800/60">
						{depth >= 2 && !showMore ? (
							<button
								onClick={() => onFocusThread(comment)}
								className="ml-4 my-2 text-[10px] text-blue-500 hover:text-blue-400 font-bold flex items-center gap-2 transition-all w-fit"
							>
								<span className="w-4 h-[1px] bg-blue-500/30"></span>
								See {comment.replies.length} other comment
								replies...
							</button>
						) : (
							comment.replies.map((reply) => (
								<CommentItem
									key={reply.id}
									comment={reply}
									postId={postId}
									currentUserId={currentUserId}
									isReply={true}
									depth={depth + 1}
									onFocusThread={onFocusThread}
									handleDelete={handleDelete}
									handleToggleLike={handleToggleLike}
									handleReplyClick={handleReplyClick}
									setReportTarget={setReportTarget}
								/>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default CommentItem;