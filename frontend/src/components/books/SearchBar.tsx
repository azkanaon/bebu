"use client";

import { Search } from "lucide-react";
import FilterPopover from "./FilterPopover";

type SearchBarProps = {
	search: string;
	setSearch: (value: string) => void;

	selectedGenre: string | null;
	setSelectedGenre: (value: string | null) => void;

	selectedAuthor: string | null;
	setSelectedAuthor: (value: string | null) => void;

	selectedLanguage: string | null;
	setSelectedLanguage: (value: string | null) => void;

	genres: string[];
	authors: string[];
	languages: string[];
};

export default function SearchBar({
	search,
	setSearch,
	selectedGenre,
	setSelectedGenre,
	selectedAuthor,
	setSelectedAuthor,
	selectedLanguage,
	setSelectedLanguage,
	genres,
	authors,
	languages,
}: SearchBarProps) {
	return (
		<div className="w-full space-y-3">
			{/* SEARCH */}
			<div className="relative">
				<div
					className="
						flex
						items-center
						rounded-2xl
						border
						border-white/[0.08]
						bg-[#0B1120]/80
						backdrop-blur-xl

						transition-all
						duration-300

						focus-within:border-blue-400/25
						focus-within:bg-blue-500/[0.05]
						focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.06)]
					"
				>
					<Search
						className="
							ml-4
							h-[18px]
							w-[18px]
							text-gray-500
						"
						strokeWidth={2.2}
					/>

					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search books"
						className="
							h-12
							w-full
							bg-transparent
							px-3
							text-[15px]
							text-white
							placeholder:text-gray-500
							outline-none
						"
					/>
				</div>
			</div>

			{/* FILTERS */}
			<div
				className="
					flex
					flex-wrap
					items-center
					gap-2
				"
			>
				<FilterPopover
					label="Genre"
					items={genres}
					selectedItem={selectedGenre}
					onSelectItem={setSelectedGenre}
				/>

				<FilterPopover
					label="Author"
					items={authors}
					selectedItem={selectedAuthor}
					onSelectItem={setSelectedAuthor}
				/>

				<FilterPopover
					label="Language"
					items={languages}
					selectedItem={selectedLanguage}
					onSelectItem={setSelectedLanguage}
				/>
			</div>
		</div>
	);
}
