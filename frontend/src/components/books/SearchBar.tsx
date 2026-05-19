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
		<div className="w-full flex flex-col gap-3">
			{/* SEARCH */}
			<div className="relative flex-1 group">
				<div
					className="
            absolute
            -inset-[1px]
            rounded-2xl
            bg-gradient-to-r
            from-blue-500/20
            to-cyan-400/20
            opacity-0
            blur-md
            transition
            duration-300
            group-focus-within:opacity-100
          "
				/>

				<div
					className="
            relative
            flex
            items-center
            bg-[#0F172A]/80
            backdrop-blur-xl
            border
            border-white/10
            rounded-2xl
            overflow-hidden
            transition
            duration-300
            group-focus-within:border-blue-400/40
          "
				>
					<Search className="absolute left-4 w-5 h-5 text-gray-400" />

					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search books, authors, genres..."
						className="
              w-full
              bg-transparent
              text-white
              placeholder:text-gray-500
              pl-12
              pr-4
              py-3.5
              outline-none
            "
					/>
				</div>
			</div>

			{/* FILTERS */}
			<div className="flex flex-wrap gap-3">
				<FilterPopover
					label="Genres"
					items={genres}
					selectedItem={selectedGenre}
					onSelectItem={setSelectedGenre}
				/>

				<FilterPopover
					label="Authors"
					items={authors}
					selectedItem={selectedAuthor}
					onSelectItem={setSelectedAuthor}
				/>

				<FilterPopover
					label="Languages"
					items={languages}
					selectedItem={selectedLanguage}
					onSelectItem={setSelectedLanguage}
				/>
			</div>
		</div>
	);
}
