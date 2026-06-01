"use client";

import { Search, Inbox } from "lucide-react";
import { SubmissionQueryParams } from "@/types/book-management";
import FilterSelect from "../report/FilterSelect";

interface SubmissionFilterBarProps {
	filters: SubmissionQueryParams;
	onFilterChange: (
		key: keyof SubmissionQueryParams,
		value: string | number,
	) => void;
}

export default function SubmissionFilterBar({
	filters,
	onFilterChange,
}: SubmissionFilterBarProps) {
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
			<div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.03] via-transparent to-purple-500/[0.01]" />

			<div className="relative flex flex-col gap-3 lg:flex-row lg:items-center">
				<div className="flex flex-1 items-center gap-3">
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
						<Inbox size={16} />
					</div>

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
							placeholder="Search submissions by title, ISBN, or submitter..."
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

				<div className="flex flex-col gap-3 sm:flex-row">
					<FilterSelect
						value={filters.status || ""}
						onChange={(value) => onFilterChange("status", value)}
						placeholder="All Status"
						options={[
							{ label: "All Status", value: "" },
							{ label: "Pending", value: "pending" },
							{ label: "Approved", value: "approved" },
							{ label: "Rejected", value: "rejected" },
							{ label: "Duplicate", value: "duplicate" },
						]}
					/>
				</div>
			</div>
		</div>
	);
}
