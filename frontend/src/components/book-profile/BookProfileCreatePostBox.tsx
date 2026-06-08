"use client";

import { motion } from "framer-motion";
import { usePostModal } from "@/stores/postModal";

import { MessageSquareText, BarChart3 } from "lucide-react";

type BookProfileCreatePostBoxProps = {
	activeTab: "review" | "analysis";
	bookTitle: string;
	bookId: number;
};

export default function BookProfileCreatePostBox({
	activeTab,
	bookTitle,
	bookId,
}: BookProfileCreatePostBoxProps) {
	const openPostModal = usePostModal((state) => state.open);

	const authStorage =
		typeof window !== "undefined"
			? localStorage.getItem("bebu-auth-storage")
			: null;

	const parsedStorage = authStorage ? JSON.parse(authStorage) : null;

	const user = parsedStorage?.state?.user;

	const handleBoxClick = () => {
		openPostModal(activeTab, {
			id: bookId,
			title: bookTitle,
		});
	};

	const isReview = activeTab === "review";

	return (
		<div className="py-1">
			<motion.button
				onClick={handleBoxClick}
				whileHover={{ y: -1 }}
				whileTap={{ scale: 0.995 }}
				className="
					group
					flex
					w-full
					items-center
					gap-3
					text-left
				"
			>
				{/* AVATAR */}
				<img
					src={
						user?.avatar ||
						`https://ui-avatars.com/api/?name=${
							user?.username || "User"
						}&background=2563eb&color=fff`
					}
					alt="Your avatar"
					className="
						h-9
						w-9
						shrink-0
						rounded-full
						border border-white/10
						object-cover
					"
				/>

				{/* INPUT SURFACE */}
				<div
					className="
						flex
						min-h-[46px]
						flex-1
						items-center
						justify-between
						rounded-full
						border border-white/[0.06]
						bg-white/[0.02]
						px-4
						transition-all
						duration-300
						group-hover:border-white/[0.1]
						group-hover:bg-white/[0.03]
					"
				>
					<div className="min-w-0">
						<p
							className="
								truncate
								text-[14px]
								text-slate-400
								transition-colors
								duration-300
								group-hover:text-slate-300
							"
						>
							{isReview
								? `Share your review on ${bookTitle}...`
								: `Share your analysis on ${bookTitle}...`}
						</p>
					</div>

					{/* ACTION ICON */}
					<div
						className={`
							ml-3
							flex
							h-7
							w-7
							items-center
							justify-center
							rounded-full
							transition-all
							duration-300
							${
								isReview
									? "text-blue-300 group-hover:bg-blue-500/10"
									: "text-indigo-300 group-hover:bg-indigo-500/10"
							}
						`}
					>
						{isReview ? (
							<MessageSquareText size={14} />
						) : (
							<BarChart3 size={14} />
						)}
					</div>
				</div>
			</motion.button>
		</div>
	);
}
