"use client";

import { Search, ShieldAlert } from "lucide-react";
import FilterSelect from "../report/FilterSelect"; // Memakai ulang komponen bawaan proyek Anda

interface AppealFilterBarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusFilterChange: (value: string) => void;
}

export default function AppealFilterBar({
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
}: AppealFilterBarProps) {
	return (
		<div
			className="
                group relative overflow-hidden rounded-3xl
                border border-white/10
                bg-white/[0.03]
                p-3
                backdrop-blur-xl
            "
		>
			{/* Ambient Orange Glow Effect */}
			<div className="absolute inset-0 bg-gradient-to-r from-orange-500/[0.03] via-transparent to-amber-500/[0.03]" />

			<div className="relative flex flex-col gap-3 lg:flex-row lg:items-center">
				<div className="flex flex-1 items-center gap-3">
					{/* Icon Identity Wrapper dengan aksen Oranye */}
					<div
						className="
                            flex h-10 w-10 items-center justify-center
                            rounded-2xl
                            bg-orange-500/10
                            text-orange-400
                            ring-1 ring-orange-400/20
                            shrink-0
                        "
					>
						<ShieldAlert size={16} />
					</div>

					{/* Search Input Control */}
					<div
						className="
                            group/search relative flex-1 overflow-hidden rounded-2xl
                            border border-white/10
                            bg-black/20
                            transition-all duration-300
                            focus-within:border-orange-400/40
                            focus-within:shadow-[0_0_0_1px_rgba(249,115,22,0.15)]
                        "
					>
						<div
							className="
                                pointer-events-none absolute left-4 top-1/2
                                -translate-y-1/2
                                text-zinc-500
                                transition-colors duration-300
                                group-focus-within/search:text-orange-300
                            "
						>
							<Search size={15} />
						</div>

						<input
							type="text"
							placeholder="Search appeals by username or display name..."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							className="
                                h-10 w-full bg-transparent
                                pl-11 pr-4
                                text-sm text-zinc-100
                                placeholder:text-zinc-500
                                outline-none
                            "
						/>
					</div>
				</div>

				{/* Dropdown Options Kategori Status Banding */}
				<div className="flex flex-col gap-3 sm:flex-row">
					<FilterSelect
						value={statusFilter}
						onChange={(value) => onStatusFilterChange(value)}
						placeholder="All Status"
						options={[
							{
								label: "All Status",
								value: "",
							},
							{
								label: "Pending Review",
								value: "Pending",
							},
							{
								label: "Approved (Restored)",
								value: "Approved",
							},
							{
								label: "Rejected (Maintained)",
								value: "Rejected",
							},
						]}
					/>
				</div>
			</div>
		</div>
	);
}
