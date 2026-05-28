"use client";

import { Search, FileText } from "lucide-react";
import { PostQueryParams } from "@/types/post-management";
import FilterSelect from "../report/FilterSelect";

interface PostFilterBarProps {
	filters: PostQueryParams;
	onFilterChange: (
		key: keyof PostQueryParams,
		value: string | number,
	) => void;
}

export default function PostFilterBar({
	filters,
	onFilterChange,
}: PostFilterBarProps) {
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
			{/* Ambient Blue/Purple Glow Effect */}
			<div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] via-transparent to-purple-500/[0.03]" />

			<div className="relative flex flex-col gap-3 lg:flex-row lg:items-center">
				<div className="flex flex-1 items-center gap-3">
					{/* Icon Identity Wrapper */}
					<div
						className="
							flex h-10 w-10 items-center justify-center
							rounded-2xl
							bg-blue-500/10
							text-blue-300
							ring-1 ring-blue-400/10
							shrink-0
						"
					>
						<FileText size={16} />
					</div>

					{/* Search Input Control */}
					<div
						className="
							group/search relative flex-1 overflow-hidden rounded-2xl
							border border-white/10
							bg-black/20
							transition-all duration-300
							focus-within:border-blue-400/40
							focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.15)]
						"
					>
						<div
							className="
								pointer-events-none absolute left-4 top-1/2
								-translate-y-1/2
								text-zinc-500
								transition-colors duration-300
								group-focus-within/search:text-blue-300
							"
						>
							<Search size={15} />
						</div>

						<input
							type="text"
							placeholder="Search posts by description, keywords, or book title..."
							value={filters.search || ""}
							onChange={(e) =>
								onFilterChange("search", e.target.value)
							}
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

				{/* Dropdown Options Context */}
				<div className="flex flex-col gap-3 sm:flex-row">
					{/* Filter Post Publish Status */}
					<FilterSelect
						value={filters.publish_status || ""}
						onChange={(value) =>
							onFilterChange("publish_status", value)
						}
						placeholder="All Status"
						options={[
							{
								label: "All Status",
								value: "",
							},
							{
								label: "Published",
								value: "published",
							},
							{
								label: "Shadowbanned",
								value: "shadowbanned",
							},
							{
								label: "Soft Deleted",
								value: "soft_deleted",
							},
						]}
					/>
				</div>
			</div>
		</div>
	);
}
