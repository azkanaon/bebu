"use client";

import { Search, BookOpen } from "lucide-react";
import { BookQueryParams } from "@/types/book-management";

interface BookCatalogFilterBarProps {
	filters: BookQueryParams;
	onFilterChange: (
		key: keyof BookQueryParams,
		value: string | number,
	) => void;
}

export default function BookCatalogFilterBar({
	filters,
	onFilterChange,
}: BookCatalogFilterBarProps) {
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
			<div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] via-transparent to-blue-500/[0.01]" />

			<div className="relative flex flex-col gap-3 lg:flex-row lg:items-center">
				<div className="flex flex-1 items-center gap-3">
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
						<BookOpen size={16} />
					</div>

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
							placeholder="Search verified catalog by title or authors..."
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
			</div>
		</div>
	);
}
