import { usePathname } from "next/navigation";
import { FriendRecommendation } from "./FriendRecommendation";
import { TrendingBooks } from "./TrendingBooks";
import { CategoryBubble } from "./CategoryBubble";
import { CategoryModal } from "./CategoryModal";
import { Leaderboard } from "./Leaderboard";
import { Footer } from "./Footer";
import { useState } from "react";

export default function RightSidebar() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [refresh, setRefresh] = useState(false);

	// 🔥 KUNCI SINKRON: Cek apakah di history state tersimpan penanda isModalView
	// Pengecekan ini berjalan instan di milidetik yang sama saat URL berubah
	const isInterceptedModal =
		typeof window !== "undefined" &&
		window.history.state?.isModalView === true;

	// Sembunyikan rekomendasi HANYA JIKA benar-benar di halaman post penuh (bukan pop-up)
	const isReallyOnPostPage =
		pathname.includes("/post/") && !isInterceptedModal;

	return (
		<div className="space-y-4 pr-8 my-4">
			{/* Pakai variabel isReallyOnPostPage yang sudah dikalkulasi instan */}
			{!isReallyOnPostPage && <FriendRecommendation />}

			{pathname !== "/books" &&
				!pathname.includes("/books/") &&
				!isReallyOnPostPage && (
					<CategoryBubble
						onAddClick={() => setIsOpen(true)}
						refresh={refresh}
					/>
				)}
			{pathname !== "/books" && <TrendingBooks />}
			<Leaderboard />
			<Footer />

			{isOpen && (
				<CategoryModal
					onClose={() => setIsOpen(false)}
					onUpdate={() => setRefresh((p) => !p)}
				/>
			)}
		</div>
	);
}
