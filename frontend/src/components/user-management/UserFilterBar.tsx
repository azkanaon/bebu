"use client";

import { Search, Users } from "lucide-react";

import { UserQueryParams } from "@/types/user-management";

import FilterSelect from "../report/FilterSelect";

interface UserFilterBarProps {
	filters: UserQueryParams;
	onFilterChange: (
		key: keyof UserQueryParams,
		value: string | number,
	) => void;
}

export default function UserFilterBar({
	filters,
	onFilterChange,
}: UserFilterBarProps) {
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
			{/* Ambient Purple/Indigo Glow */}
			<div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.03] via-transparent to-indigo-500/[0.03]" />

			<div className="relative flex flex-col gap-3 lg:flex-row lg:items-center">
				<div className="flex flex-1 items-center gap-3">
					{/* Icon Identity Wrapper */}
					<div
						className="
							flex h-10 w-10 items-center justify-center
							rounded-2xl
							bg-purple-500/10
							text-purple-300
							ring-1 ring-purple-400/10
							shrink-0
						"
					>
						<Users size={16} />
					</div>

					{/* Search Input Control */}
					<div
						className="
							group/search relative flex-1 overflow-hidden rounded-2xl
							border border-white/10
							bg-black/20
							transition-all duration-300
							focus-within:border-purple-400/40
							focus-within:shadow-[0_0_0_1px_rgba(168,85,247,0.15)]
						"
					>
						<div
							className="
								pointer-events-none absolute left-4 top-1/2
								-translate-y-1/2
								text-zinc-500
								transition-colors duration-300
								group-focus-within/search:text-purple-300
							"
						>
							<Search size={15} />
						</div>

						<input
							type="text"
							placeholder="Search directory by username, email, or name..."
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
					{/* Filter Account Status */}
					<FilterSelect
						value={filters.status || ""}
						onChange={(value) => onFilterChange("status", value)}
						placeholder="All Status"
						options={[
							{
								label: "All Status",
								value: "",
							},
							{
								label: "Active",
								value: "active",
							},
							{
								label: "Suspended",
								value: "suspended",
							},
							{
								label: "Banned",
								value: "banned",
							},
							{
								label: "Shadowbanned",
								value: "shadowbanned",
							},
						]}
					/>

					{/* Filter Authorization Role */}
					<FilterSelect
						value={filters.role || ""}
						onChange={(value) => onFilterChange("role", value)}
						placeholder="All Role"
						options={[
							{
								label: "All Role",
								value: "",
							},
							{
								label: "User",
								value: "user",
							},
							{
								label: "Admin",
								value: "admin",
							},
						]}
					/>
				</div>
			</div>
		</div>
	);
}
