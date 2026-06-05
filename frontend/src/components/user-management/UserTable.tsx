"use client";

import clsx from "clsx";
import {
	ChevronLeft,
	ChevronRight,
	UserX,
	ShieldCheck,
	Mail,
	MailCheck,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

import { UserManageableResponse } from "@/types/user-management";

interface UserTableProps {
	data: UserManageableResponse[];
	loading: boolean;
	onSelect: (user: UserManageableResponse) => void;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	onPageChange: (page: number) => void;
}

export default function UserTable({
	data,
	loading,
	onSelect,
	currentPage,
	totalPages,
	totalItems,
	onPageChange,
}: UserTableProps) {
	const safeData = data || [];
	const itemsPerPage = 10;

	// State Loading Skeleton
	if (loading) {
		return (
			<div className="flex h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
				<div className="flex items-center gap-3 text-sm text-zinc-400">
					<div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
					Loading directory database records...
				</div>
			</div>
		);
	}

	// State Empty / Data tidak ditemukan
	if (safeData.length === 0) {
		return (
			<div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.02] text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] text-zinc-500">
					<UserX size={24} />
				</div>
				<div>
					<h3 className="text-sm font-medium text-zinc-200">
						No users match criteria
					</h3>
					<p className="mt-1 text-xs text-zinc-500">
						Try adjusting your search query or status filters.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* STRUCTURED DATA GRID TABLE */}
			<div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
				{/* HEADERS */}
				<div className="grid grid-cols-12 border-b border-white/5 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
					<div className="col-span-4">Identity / Profile</div>
					<div className="col-span-2">Role</div>
					<div className="col-span-2">Verification</div>
					<div className="col-span-2">Last Login</div>
					<div className="col-span-2 text-right">Account Status</div>
				</div>

				{/* DATA ROWS */}
				<div className="divide-y divide-white/[0.03]">
					{safeData.map((user) => (
						<button
							key={user.user_id}
							onClick={() => onSelect(user)}
							className="group grid w-full grid-cols-12 items-center px-6 py-4 text-left transition-all duration-200 hover:bg-white/[0.03]"
						>
							{/* IDENTITY PROFILE INFO */}
							<div className="col-span-4 pr-6">
								<div className="flex items-center gap-3">
									<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
										<UserAvatar
											user={{
												avatar_url: user.avatar_url,
											}}
											size={40}
											className="border-2 border-white/30"
										/>
									</div>

									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-zinc-100 group-hover:text-white transition-colors duration-200">
											{user.display_name || user.username}
										</p>
										<p className="truncate text-xs text-zinc-500 mt-0.5">
											@{user.username} · {user.email}
										</p>
									</div>
								</div>
							</div>

							{/* ROLE BADGE */}
							<div className="col-span-2">
								<span
									className={clsx(
										"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
										user.role === "admin"
											? "border-red-500/15 bg-red-500/[0.08] text-red-300"
											: "border-purple-500/15 bg-purple-500/[0.08] text-purple-300",
									)}
								>
									{user.role === "admin" && (
										<ShieldCheck size={11} />
									)}
									{user.role}
								</span>
							</div>

							{/* EMAIL VERIFICATION STATUS */}
							<div className="col-span-2">
								<div
									className={clsx(
										"flex items-center gap-2 text-xs",
										user.email_verified
											? "text-emerald-400"
											: "text-zinc-500",
									)}
								>
									{user.email_verified ? (
										<>
											<MailCheck
												size={14}
												className="text-emerald-400/80"
											/>
											<span>Verified</span>
										</>
									) : (
										<>
											<Mail
												size={14}
												className="text-zinc-600"
											/>
											<span className="italic">
												Unverified
											</span>
										</>
									)}
								</div>
							</div>

							{/* LAST LOGIN */}
							<div className="col-span-2">
								<p className="text-xs text-zinc-400">
									{user.last_login ? (
										new Date(
											user.last_login,
										).toLocaleString("id-ID", {
											dateStyle: "medium",
											timeStyle: "short",
										})
									) : (
										<span className="text-zinc-600 italic">
											Never
										</span>
									)}
								</p>
							</div>

							{/* STATUS ACCOUNT LEVEL */}
							<div className="col-span-2 flex justify-end">
								<div
									className={clsx(
										"inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
										user.status === "active"
											? "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-300"
											: user.status === "suspended"
												? "border-amber-500/15 bg-amber-500/[0.08] text-amber-300"
												: "border-red-500/15 bg-red-500/[0.08] text-red-400",
									)}
								>
									{user.status}
								</div>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* PAGINATION TELEMETRY CONTROL */}
			<div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2 text-xs">
					<div className="h-1.5 w-1.5 rounded-full bg-purple-400/70" />
					<p className="text-zinc-500">
						Identity Matrix ·{" "}
						<span className="font-medium text-zinc-300">
							{totalItems}
						</span>{" "}
						registered users
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() =>
							onPageChange(Math.max(currentPage - 1, 1))
						}
						disabled={currentPage === 1}
						className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-400 transition-all duration-200 hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30"
					>
						<ChevronLeft size={16} />
					</button>

					<div className="flex items-center gap-1">
						{Array.from({ length: totalPages }, (_, index) => {
							const pageNum = index + 1;
							if (
								pageNum === 1 ||
								pageNum === totalPages ||
								Math.abs(currentPage - pageNum) <= 1
							) {
								return (
									<button
										key={pageNum}
										onClick={() => onPageChange(pageNum)}
										className={clsx(
											"h-9 w-9 rounded-xl text-sm font-medium transition-all duration-200",
											currentPage === pageNum
												? "border border-purple-500/20 bg-purple-500/[0.10] text-purple-200"
												: "text-zinc-500 hover:bg-white/[0.04] hover:text-white",
										)}
									>
										{pageNum}
									</button>
								);
							}

							if (pageNum === 2 || pageNum === totalPages - 1) {
								return (
									<span
										key={pageNum}
										className="px-1 text-zinc-600"
									>
										...
									</span>
								);
							}
							return null;
						})}
					</div>

					<button
						onClick={() =>
							onPageChange(Math.min(currentPage + 1, totalPages))
						}
						disabled={currentPage === totalPages}
						className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-400 transition-all duration-200 hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
		</div>
	);
}
