import React, { useState } from "react";
import { MoreVertical, Trash2, Flag, Heart, AlertTriangle } from "lucide-react";
import { CommentType } from "@/types/post";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

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

	return (
		<div className={`flex flex-col gap-3 ${isReply ? "pl-6" : ""}`}>
			{/* Konten Komentar */}
			<div className="flex gap-3 items-start relative group/item">
				<img
					src={
						comment.avatar ||
						`https://ui-avatars.com/api/?name=${comment.username}`
					}
					alt={comment.username}
					className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-800"
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
															This is Permanent Action!
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
															setOpenMenuId(null); // Tutup dropdown setelah hapus
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
										// Tombol Laporkan
										<button
											onClick={() => {
												setReportTarget({
													id: comment.user_id,
													type: "comment",
												});
												setOpenMenuId(null);
											}}
											className="w-full px-4 py-2 text-left text-[11px] text-gray-400 hover:bg-gray-800 flex items-center gap-2 transition-colors"
										>
											<Flag size={12} /> Report
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
							className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-400 transition font-bold uppercase tracking-wider"
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
							/* Jika belum mencapai limit atau sudah diklik 'showMore', render semua item */
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
