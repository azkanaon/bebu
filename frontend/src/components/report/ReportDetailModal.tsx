"use client";

import { useEffect, useState } from "react";

import clsx from "clsx";

import {
	X,
	ShieldAlert,
	User,
	FileText,
	Clock3,
	CalendarClock,
	CheckCircle2,
	Ban,
	AlertTriangle,
	EyeOff,
	Trash2,
} from "lucide-react";

import { getReportDetailAPI, executeAdminActionAPI } from "@/lib/api";

import {
	ReportSummaryDetailResponse,
	AdminActionRequest,
} from "@/types/report";

interface ReportDetailModalProps {
	summaryID: number | null;
	onClose: () => void;
	onActionSuccess?: () => void;
}

interface ActionOption {
	value: string;
	label: string;
	description: string;
	icon: any;
	tone: "neutral" | "warning" | "danger";
}

export default function ReportDetailModal({
	summaryID,
	onClose,
	onActionSuccess,
}: ReportDetailModalProps) {
	const [detail, setDetail] = useState<ReportSummaryDetailResponse | null>(
		null,
	);

	const [loading, setLoading] = useState(false);

	const [selectedAction, setSelectedAction] = useState("");

	const [adminReason, setAdminReason] = useState("");

	const [durationDays, setDurationDays] = useState("7");

	const [isPermanent, setIsPermanent] = useState(false);

	const [submitting, setSubmitting] = useState(false);

	const isLocked = detail?.status !== "Not reviewed";

	useEffect(() => {
		if (!summaryID) return;

		const fetchDetail = async () => {
			setLoading(true);

			try {
				const res = await getReportDetailAPI(summaryID);
				console.log("Isi dari res:", res);
				const detailData = res.data;

				setDetail(detailData);

				if (detailData.moderation_history) {
					const history = detailData.moderation_history;

					setSelectedAction(history.action_type || "");

					setAdminReason(history.reason || "");

					if (history.duration_days && history.duration_days > 0) {
						setDurationDays(String(history.duration_days));
					}

					setIsPermanent(history.duration_days === -1);
				} else {
					setSelectedAction("");
					setAdminReason("");
					setDurationDays("7");
					setIsPermanent(false);
				}
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchDetail();
	}, [summaryID]);

	const requiresDuration = (action: string) => {
		return [
			"suspend",
			"shadowban_user",
			"shadowban_post",
			"soft_delete",
		].includes(action);
	};

	const handleExecuteAction = async () => {
		if (!selectedAction || !summaryID) return;

		setSubmitting(true);

		try {
			let finalDuration: number | null = null;

			if (requiresDuration(selectedAction)) {
				finalDuration = isPermanent
					? -1
					: parseInt(durationDays, 10) || 1;
			} else if (
				selectedAction === "ban_permanent" ||
				selectedAction === "hard_delete"
			) {
				finalDuration = -1;
			}

			const payload: AdminActionRequest = {
				report_summary_id: summaryID,
				action: selectedAction,
				duration_days: finalDuration,
				reason: adminReason.trim() || "No moderation notes provided.",
			};

			const response = await executeAdminActionAPI(payload);

			alert(response.message || "Action executed successfully.");

			onActionSuccess?.();

			onClose();
		} catch (err: any) {
			alert(
				err?.response?.data?.error ||
					"Failed to execute moderation action.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (!summaryID) return null;

	const actionOptions: ActionOption[] =
		detail?.entity_type === "user"
			? [
					{
						value: "dismiss",
						label: "Dismiss Case",
						description: "No violation detected.",
						icon: CheckCircle2,
						tone: "neutral",
					},
					{
						value: "warning",
						label: "Issue Warning",
						description: "Send behavioral notice.",
						icon: AlertTriangle,
						tone: "warning",
					},
					{
						value: "shadowban_user",
						label: "Shadowban User",
						description: "Reduce visibility silently.",
						icon: EyeOff,
						tone: "warning",
					},
					{
						value: "suspend",
						label: "Suspend Account",
						description: "Temporarily restrict access.",
						icon: Ban,
						tone: "danger",
					},
					{
						value: "ban_permanent",
						label: "Permanent Ban",
						description: "Terminate platform access.",
						icon: ShieldAlert,
						tone: "danger",
					},
				]
			: [
					{
						value: "dismiss",
						label: "Dismiss Case",
						description: "No violation detected.",
						icon: CheckCircle2,
						tone: "neutral",
					},
					{
						value: "shadowban_post",
						label: "Shadowban Post",
						description: "Limit feed distribution.",
						icon: EyeOff,
						tone: "warning",
					},
					{
						value: "soft_delete",
						label: "Soft Delete",
						description: "Hide from public feeds.",
						icon: Trash2,
						tone: "warning",
					},
					{
						value: "hard_delete",
						label: "Hard Delete",
						description: "Permanently remove content.",
						icon: Ban,
						tone: "danger",
					},
				];

	return (
		<div
			className="
				fixed inset-0 z-50
				flex items-center justify-center
				bg-black/70
				p-4
				backdrop-blur-md
				animate-in fade-in-0
			"
		>
			<div
				className="
					relative
					w-full max-w-3xl
					overflow-hidden

					rounded-3xl

					border border-white/10

					bg-[#09090B]/95

					backdrop-blur-2xl

					shadow-2xl
					shadow-black/50

					animate-in
					fade-in-0
					zoom-in-[0.98]
					slide-in-from-bottom-4

					duration-300
				"
			>
				{/* Ambient */}
				<div
					className="
						pointer-events-none
						absolute inset-0

						bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_40%)]
					"
				/>

				{/* HEADER */}
				<div
					className="
						relative
						flex items-start justify-between

						border-b border-white/5

						px-6 py-5
					"
				>
					<div>
						<div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-blue-300/80">
							<ShieldAlert size={12} />
							Trust & Safety
						</div>

						<h2 className="mt-3 text-lg font-semibold text-white">
							Moderation Case Review
						</h2>

						<p className="mt-1 text-xs text-zinc-500">
							Case ID #{summaryID}
						</p>
					</div>

					<button
						onClick={onClose}
						className="
							flex h-9 w-9 items-center justify-center
							rounded-2xl

							border border-white/10

							bg-white/[0.03]

							text-zinc-500

							transition-all duration-200

							hover:border-white/20
							hover:bg-white/[0.05]
							hover:text-white
						"
					>
						<X size={15} />
					</button>
				</div>

				{/* CONTENT */}
				<div
					className="
						custom-scrollbar
						max-h-[68vh]
						overflow-y-auto

						p-6
					"
				>
					{loading ? (
						<div className="flex h-[320px] items-center justify-center">
							<div className="flex items-center gap-3 text-sm text-zinc-400">
								<div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
								Loading moderation intelligence...
							</div>
						</div>
					) : detail ? (
						<div className="space-y-6">
							{/* ENTITY CARD */}
							<div
								className="
									rounded-[24px]
									border border-white/10
									bg-white/[0.03]
									p-5
								"
							>
								{detail.entity_type === "user" &&
									detail.user_data && (
										<div className="flex gap-4">
											<img
												src={
													detail.user_data
														.avatar_url ||
													"/images/default_avatar.png"
												}
												className="
													h-16 w-16 shrink-0
													rounded-2xl
													object-cover

													ring-1
													ring-white/10
												"
											/>

											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<div
														className="
															flex h-8 w-8 items-center justify-center
															rounded-xl
															bg-blue-500/[0.10]
															text-blue-300
														"
													>
														<User size={14} />
													</div>

													<div>
														<h3 className="text-base font-semibold text-white">
															{
																detail.user_data
																	.display_name
															}
														</h3>

														<p className="text-xs text-zinc-500">
															@
															{
																detail.user_data
																	.username
															}
														</p>
													</div>
												</div>

												<p className="mt-3 max-w-xl text-xs leading-relaxed text-zinc-400">
													{detail.user_data.bio}
												</p>

												<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
													<MetricCard
														label="Followers"
														value={
															detail.user_data
																.total_followers
														}
													/>

													<MetricCard
														label="Posts"
														value={
															detail.user_data
																.total_posts
														}
													/>

													<MetricCard
														label="Hot Score"
														value={detail.user_data.hot_score.toFixed(
															1,
														)}
													/>

													<MetricCard
														label="Status"
														value={
															detail.user_data
																.status
														}
													/>
												</div>
											</div>
										</div>
									)}

								{detail.entity_type === "post" &&
									detail.post_data && (
										<div className="space-y-4">
											<div className="flex items-center gap-3">
												<div
													className="
														flex h-9 w-9 items-center justify-center
														rounded-2xl
														bg-purple-500/[0.10]
														text-purple-300
													"
												>
													<FileText size={16} />
												</div>

												<div>
													<p className="text-[10px] uppercase tracking-[0.18em] text-purple-300/80">
														Reported Content
													</p>

													<h3 className="mt-1 text-sm font-semibold text-white">
														{
															detail.post_data
																.book_title
														}
													</h3>
												</div>
											</div>

											<p className="max-w-2xl text-xs leading-relaxed text-zinc-300">
												&ldquo;
												{detail.post_data.description}
												&rdquo;
											</p>

											{detail.post_data.img_url && (
												<img
													src={
														detail.post_data.img_url
													}
													className="
														max-h-[220px]
														w-full
														rounded-2xl
														object-cover

														border border-white/10
													"
												/>
											)}
										</div>
									)}
							</div>

							{/* TIMELINE */}
							<div className="grid gap-3 sm:grid-cols-2">
								<TimelineCard
									icon={<Clock3 size={14} />}
									label="First Report"
									value={new Date(
										detail.first_report,
									).toLocaleString("id-ID")}
								/>

								<TimelineCard
									icon={<CalendarClock size={14} />}
									label="Latest Activity"
									value={new Date(
										detail.last_report,
									).toLocaleString("id-ID")}
								/>
							</div>

							{/* REASON DISTRIBUTION */}
							<div className="space-y-3">
								<div>
									<p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
										Reason Distribution
									</p>

									<h4 className="mt-2 text-sm font-medium text-zinc-200">
										Detected report signals
									</h4>
								</div>

								<div className="flex flex-wrap gap-2">
									{detail.reason_counts.map((rc, idx) => (
										<div
											key={idx}
											className="
													inline-flex items-center gap-2
													rounded-2xl

													border border-white/10

													bg-white/[0.03]

													px-3 py-1.5
												"
										>
											<span className="text-[11px] text-zinc-300">
												{rc.reason_text}
											</span>

											<div
												className="
														rounded-full
														bg-red-500/[0.10]
														px-2 py-0.5

														text-[10px]
														font-semibold
														text-red-300
													"
											>
												{rc.count}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* ACTIONS */}
							<div className="space-y-3">
								<div>
									<p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
										Enforcement Strategy
									</p>

									<h4 className="mt-2 text-sm font-medium text-zinc-200">
										Select moderation action
									</h4>
								</div>

								<div className="grid gap-3 sm:grid-cols-2">
									{actionOptions.map((action) => {
										const Icon = action.icon;

										const isActive =
											selectedAction === action.value;

										return (
											<button
												key={action.value}
												disabled={isLocked}
												onClick={() => {
													setSelectedAction(
														action.value,
													);

													setIsPermanent(false);
												}}
												className={clsx(
													`
															group relative overflow-hidden

															rounded-[22px]

															border

															p-4

															text-left

															transition-all
															duration-200
														`,
													isActive
														? `
																border-blue-500/30
																bg-blue-500/[0.08]
															`
														: `
																border-white/10
																bg-white/[0.03]

																hover:border-white/20
																hover:bg-white/[0.05]
															`,
												)}
											>
												<div className="flex items-start gap-3">
													<div
														className={clsx(
															`
																	flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
																`,
															action.tone ===
																"danger"
																? `
																		bg-red-500/[0.10]
																		text-red-300
																	`
																: action.tone ===
																	  "warning"
																	? `
																			bg-amber-500/[0.10]
																			text-amber-300
																		`
																	: `
																			bg-emerald-500/[0.10]
																			text-emerald-300
																		`,
														)}
													>
														<Icon size={16} />
													</div>

													<div>
														<h5 className="text-sm font-semibold text-white">
															{action.label}
														</h5>

														<p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
															{action.description}
														</p>
													</div>
												</div>
											</button>
										);
									})}
								</div>
							</div>

							{/* DURATION */}
							{requiresDuration(selectedAction) && (
								<div
									className="
										rounded-[24px]
										border border-white/10
										bg-white/[0.03]
										p-4
									"
								>
									<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<h4 className="text-sm font-medium text-zinc-100">
												Duration configuration
											</h4>

											<p className="mt-1 text-[11px] text-zinc-500">
												Set how long this action remains
												active.
											</p>
										</div>

										<div className="flex items-center gap-4">
											<input
												type="number"
												min="1"
												max="365"
												disabled={
													isPermanent || isLocked
												}
												value={durationDays}
												onChange={(e) =>
													setDurationDays(
														e.target.value,
													)
												}
												className="
													h-10 w-20 rounded-2xl

													border border-white/10

													bg-black/20

													px-3

													text-sm text-white

													outline-none

													focus:border-blue-400/30
												"
											/>

											<label className="flex items-center gap-2 text-xs text-zinc-400">
												<input
													type="checkbox"
													disabled={isLocked}
													checked={isPermanent}
													onChange={(e) =>
														setIsPermanent(
															e.target.checked,
														)
													}
												/>
												Indefinite
											</label>
										</div>
									</div>
								</div>
							)}

							{/* HISTORICAL MODERATION INFO */}
							{detail.moderation_history && (
								<div
									className="
				relative overflow-hidden

				rounded-[22px]

				border border-emerald-500/10

				bg-emerald-500/[0.04]

				p-4
			"
								>
									{/* Ambient Glow */}
									<div
										className="
					absolute inset-0

					bg-gradient-to-r
					from-emerald-500/[0.03]
					to-transparent
				"
									/>

									<div className="relative flex items-start justify-between gap-4">
										<div>
											<p
												className="
							text-[10px]
							font-semibold
							uppercase
							tracking-[0.18em]

							text-emerald-300/80
						"
											>
												Previously Reviewed
											</p>

											<h5 className="mt-1 text-sm font-medium text-white">
												@
												{
													detail.moderation_history
														.admin_username
												}
											</h5>
										</div>

										<div className="text-right">
											<p className="text-[11px] text-zinc-500">
												{new Date(
													detail.moderation_history
														.created_at,
												).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "short",
													year: "numeric",
												})}
											</p>

											<p className="mt-1 text-[11px] text-zinc-600">
												{new Date(
													detail.moderation_history
														.created_at,
												).toLocaleTimeString("id-ID", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>
									</div>

									{/* REASON */}
									{detail.moderation_history.reason && (
										<div
											className="
						relative

						mt-3

						rounded-2xl

						border border-white/5

						bg-black/20

						p-3
					"
										>
											<p className="text-[11px] leading-relaxed text-zinc-400">
												“
												{
													detail.moderation_history
														.reason
												}
												”
											</p>
										</div>
									)}
								</div>
							)}

							{/* NOTES */}
							{!isLocked && (
								<div className="space-y-3">
									<div>
										<p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
											Internal Notes
										</p>
									</div>

									<textarea
										value={adminReason}
										onChange={(e) =>
											setAdminReason(e.target.value)
										}
										rows={3}
										disabled={isLocked}
										placeholder="Write moderation notes or internal audit details..."
										className="
										custom-scrollbar
										overflow-y-auto
										w-full rounded-[24px]

										border border-white/10

										bg-white/[0.03]

										p-4

										text-sm text-zinc-200
										placeholder:text-zinc-600

										outline-none

										transition-all
										duration-200

										focus:border-blue-400/30
										focus:bg-white/[0.05]

										resize-none
									"
									/>
								</div>
							)}
						</div>
					) : (
						<div className="py-20 text-center text-sm text-red-400">
							Failed to load moderation intelligence.
						</div>
					)}
				</div>

				{/* FOOTER */}
				<div
					className="
						flex items-center justify-between

						border-t border-white/5

						bg-black/20

						px-6 py-4
					"
				>
					<div className="flex items-center gap-2 text-[11px] text-zinc-500">
						<div className="h-1.5 w-1.5 rounded-full bg-blue-400/70" />
						Actions are permanently logged
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={onClose}
							className="
								h-10 rounded-2xl

								border border-white/10

								bg-white/[0.03]

								px-4

								text-sm
								font-medium
								text-zinc-300

								transition-all
								duration-200

								hover:border-white/20
								hover:text-white
							"
						>
							Cancel
						</button>

						<button
							onClick={handleExecuteAction}
							disabled={submitting || !selectedAction || isLocked}
							className="
								h-10 rounded-2xl

								bg-blue-500

								px-4

								text-sm
								font-semibold
								text-white

								transition-all
								duration-200

								hover:bg-blue-400

								disabled:pointer-events-none
								disabled:opacity-40
							"
						>
							{submitting ? "Processing..." : "Execute Action"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function MetricCard({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<div
			className="
				rounded-2xl
				border border-white/10
				bg-black/20
				p-3
			"
		>
			<p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
				{label}
			</p>

			<p className="mt-2 text-xs font-semibold text-zinc-100">{value}</p>
		</div>
	);
}

function TimelineCard({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div
			className="
				flex items-start gap-3

				rounded-[24px]

				border border-white/10

				bg-white/[0.03]

				p-4
			"
		>
			<div
				className="
					flex h-9 w-9 shrink-0 items-center justify-center
					rounded-xl

					bg-blue-500/[0.10]

					text-blue-300
				"
			>
				{icon}
			</div>

			<div>
				<p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
					{label}
				</p>

				<p className="mt-2 text-xs font-medium leading-relaxed text-zinc-200">
					{value}
				</p>
			</div>
		</div>
	);
}
