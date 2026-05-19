"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { getBookFiltersAPI, searchBooksAPI, getPopularBooksAPI, } from "@/lib/api";
import { BookSearchItem, PopularBookItem } from "@/types/book";
import SearchBar from "@/components/books/SearchBar";
import SearchResults from "@/components/books/SearchResults";
import SearchPagination from "@/components/books/SearchPagination";
import ViewToggle from "@/components/books/ViewToggle";
import PopularBooksSection from "@/components/books/PopularBooksSection";
import HighlyRatedBooksSection from "@/components/books/HighlyRatedBooksSection";
import AllBooksSection from "@/components/books/AllBooksSection";

export default function BooksPage() {
	const [search, setSearch] = useState("");
	const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
	const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
	const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
		null,
	);

	// Filter Options
	const [genres, setGenres] = useState<string[]>([]);
	const [authors, setAuthors] = useState<string[]>([]);
	const [languages, setLanguages] = useState<string[]>([]);

	const debouncedSearch = useDebounce(search, 500);

	const [isSearching, setIsSearching] = useState(false);
	const [searchResults, setSearchResults] = useState<BookSearchItem[]>([]);

	// Pagination Search
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	// View Search Mode
	const [viewMode, setViewMode] = useState<"list" | "grid">("list");

	// Popular Books
	const [popularBooks, setPopularBooks] = useState<PopularBookItem[]>([]);
	const [popularRange, setPopularRange] = useState<"today" | "7d" | "30d" | "all">("today");
	const [isLoadingPopular, setIsLoadingPopular] = useState(false);
	
	// FETCH FILTERS
	useEffect(() => {
		const fetchFilters = async () => {
			try {
				const data = await getBookFiltersAPI({
					genre: selectedGenre,
					author: selectedAuthor,
					language: selectedLanguage,
				});

				setGenres(data.genres);
				setAuthors(data.authors);
				setLanguages(data.languages);
			} catch (error) {
				console.error(error);
			}
		};

		fetchFilters();
	}, [selectedGenre, selectedAuthor, selectedLanguage]);

	// Fetch Popular Books
	useEffect(() => {
		const fetchPopularBooks = async () => {
			try {
				setIsLoadingPopular(true);

				const data = await getPopularBooksAPI(popularRange);

				setPopularBooks(data.books || []);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoadingPopular(false);
			}
		};

		fetchPopularBooks();
	}, [popularRange]);

	// Search Book
	useEffect(() => {
		const fetchBooks = async () => {
			// kalau semua kosong jangan search
			const noSearch =
				!debouncedSearch.trim() &&
				!selectedGenre &&
				!selectedAuthor &&
				!selectedLanguage;

			if (noSearch) {
				setSearchResults([]);
				return;
			}

			try {
				setIsSearching(true);

				const data = await searchBooksAPI({
					q: debouncedSearch,
					genre: selectedGenre,
					author: selectedAuthor,
					language: selectedLanguage,
					page,
					limit: 10,
				});

				setSearchResults(data.books || []);
				setTotalPages(data.total_pages || 1);
			} catch (error) {
				console.error(error);
			} finally {
				setIsSearching(false);
			}
		};

		fetchBooks();
	}, [debouncedSearch, selectedGenre, selectedAuthor, selectedLanguage, page]);

	// Pagination
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, selectedGenre, selectedAuthor, selectedLanguage]);

	// Reset Page After Change Page
	useEffect(() => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	}, [page]);

	const isSearchMode =
		debouncedSearch.trim().length > 0 ||
		selectedGenre !== null ||
		selectedAuthor !== null ||
		selectedLanguage !== null;

	return (
		<div className="space-y-6 py-4">
			{/* SEARCH */}
			<SearchBar
				search={search}
				setSearch={setSearch}
				selectedGenre={selectedGenre}
				setSelectedGenre={setSelectedGenre}
				selectedAuthor={selectedAuthor}
				setSelectedAuthor={setSelectedAuthor}
				selectedLanguage={selectedLanguage}
				setSelectedLanguage={setSelectedLanguage}
				genres={genres}
				authors={authors}
				languages={languages}
			/>

			{/* SEARCH MODE */}
			{isSearchMode ? (
				<>
					<div className="flex items-center justify-between">
						<p className="text-sm text-gray-400">
							{searchResults.length} result(s)
						</p>

						<ViewToggle
							viewMode={viewMode}
							setViewMode={setViewMode}
						/>
					</div>

					<SearchResults
						books={searchResults}
						isSearching={isSearching}
						viewMode={viewMode}
					/>

					<SearchPagination
						page={page}
						totalPages={totalPages}
						onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
						onNext={() =>
							setPage((prev) => Math.min(prev + 1, totalPages))
						}
					/>
				</>
			) : (
				<>
					{/* MOST POPULAR */}
					<PopularBooksSection />

					{/* HIGHLY RATED */}
					<HighlyRatedBooksSection />

					{/* ALL BOOKS */}
					<AllBooksSection />
				</>
			)}
		</div>
	);
}
