"use client";

import { motion, Variants } from "framer-motion";
import ProfileHeader from "@/components/profile/ProfileHeader";
import Achievements from "@/components/profile/Achievements";
import Badges from "@/components/profile/Badges";
import PostTabs from "@/components/profile/PostTabs";
import { useProfile } from "@/api/profile/useProfile";
import { use, useState, useEffect } from "react";
import { PrivateProfileWall } from "@/components/profile/PrivateProfileWall";
import { AlertTriangle, ShieldAlert, Clock } from "lucide-react"; // 💡 Tambah ikon Clock
import AccountAppealModal from "@/components/AccountAppealModal";
import ClientPortal from "../../../components/ClientPortal";

const container: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.12,
		},
	},
};

const item: Variants = {
	hidden: { opacity: 0, y: 30 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.4,
			ease: "easeOut",
		},
	},
};

type Props = {
	params: Promise<{
		username: string;
	}>;
};

export default function ProfileClient({ params }: Props) {
	const { username } = use(params);
	const { data, isLoading, error } = useProfile(username);

	// State untuk kontrol modal banding
	const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
	const [currentUserId, setCurrentUserId] = useState<
		string | number | undefined
	>(undefined);

	// 💡 State lokal agar tombol langsung mengunci secara instan tanpa menunggu reload/refresh query cache
	const [hasSubmittedAppeal, setHasSubmittedAppeal] = useState(false);

	// Ambil currentUserId dari localStorage untuk mencocokkan kepemilikan akun
	useEffect(() => {
		try {
			const authStorage = localStorage.getItem("bebu-auth-storage");
			if (authStorage) {
				const parsedStorage = JSON.parse(authStorage);
				const userPublicId = parsedStorage?.state?.user?.user_public_id;
				if (userPublicId) {
					setCurrentUserId(userPublicId);
				}
			}
		} catch (e) {
			console.error("Gagal membaca auth storage di profile:", e);
		}
	}, []);

	if (isLoading) {
		return <LoadingPlaceholder />;
	}

	if (error || !data) {
		return <ErrorPlaceholder />;
	}

	// 1. Menentukan kepemilikan profil hanya berdasarkan kecocokan ID pengguna
	const isOwnProfile =
		currentUserId !== undefined &&
		(currentUserId === data.publicId || currentUserId === data.userId);

	// 2. Mengecek status penangguhan langsung dari properti status utama milik objek user
	const isSuspended = data.status === "suspended";

	// 3. Menentukan apakah user sudah pernah mengajukan banding
	// (Membaca data backend opsional 'hasPendingAppeal' ATAU state lokal Next.js)
	const isAppealPending =
		data.viewerContext?.hasPendingAppeal || hasSubmittedAppeal;

	return (
		<>
			<motion.div
				variants={container}
				initial="hidden"
				animate="show"
				className="space-y-6 py-4"
			>
				{/* BANNER SUSPENDED: Hanya muncul jika akunnya di-suspend DAN ini adalah profil milik user itu sendiri */}
				{isSuspended && isOwnProfile && (
					<motion.div
						variants={item}
						className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 shadow-lg backdrop-blur-sm"
					>
						<div className="flex items-start gap-3">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
								<ShieldAlert size={18} />
							</div>
							<div>
								<h4 className="text-sm font-bold text-amber-200">
									Your Account Has Been Suspended
								</h4>
								<p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
									{isAppealPending
										? // 💡 Teks berubah dinamis mengabari status peninjauan
											"Your appeal has been successfully submitted and is currently being reviewed by the Bebu administration team. Please wait for further updates regarding your case."
										: "Interaction features (writing reviews, commenting, and liking) have been temporarily disabled. If you believe this is a mistake, you may submit an appeal for review."}
								</p>
							</div>
						</div>

						{/* 💡 Kondisi Tombol: Jika sudah kirim, tombol di-disable dan warnanya dibuat redup/zinc */}
						{isAppealPending ? (
							<div className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-400 border border-white/5 cursor-not-allowed">
								<Clock size={14} />
								Appeal Under Review
							</div>
						) : (
							<button
								onClick={() => setIsAppealModalOpen(true)}
								className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-300 transition-all active:scale-[0.98]"
							>
								<AlertTriangle size={14} />
								Submit Appeal
							</button>
						)}
					</motion.div>
				)}

				<motion.div variants={item}>
					<ProfileHeader
						publicId={data.publicId}
						username={data.username}
						profile={data.profile}
						stats={data.stats}
						socialLinks={data.socialLinks}
						viewerContext={data.viewerContext}
						settings={data.settings}
						isPrivateAccount={data.isPrivateAccount}
						userId={data.userId}
					/>
				</motion.div>

				{data.isPrivate ? (
					<motion.div variants={item}>
						<PrivateProfileWall />
					</motion.div>
				) : (
					<>
						<motion.div variants={item}>
							<Achievements
								items={data.favoriteAchievements}
								username={username}
							/>
						</motion.div>

						<motion.div variants={item}>
							<Badges
								items={data.favoriteBadges}
								username={username}
							/>
						</motion.div>

						<motion.div variants={item}>
							<PostTabs username={username} />
						</motion.div>
					</>
				)}
			</motion.div>

			{/* Modal Banding yang akan muncul ketika tombol di banner diklik */}
			<ClientPortal>
				<AccountAppealModal
					isOpen={isAppealModalOpen}
					onClose={() => setIsAppealModalOpen(false)}
					onSuccess={() => {
						// 💡 1. Set state lokal menjadi true agar UI langsung mengunci tombol pengajuan
						setHasSubmittedAppeal(true);

						alert(
							"Banding berhasil dikirim! Tim admin akan segera meninjau akun Anda.",
						);
					}}
				/>
			</ClientPortal>
		</>
	);
}

function LoadingPlaceholder() {
	return (
		<div className="py-20 text-center text-slate-500">
			Loading profile...
		</div>
	);
}

function ErrorPlaceholder() {
	return (
		<div className="py-20 text-center text-red-400">
			Failed to load profile.
		</div>
	);
}
