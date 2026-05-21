import React from "react";
import { getBookProfileAPI, getBookRecommendationsAPI } from "@/lib/api";
import { notFound } from "next/navigation";
import { BookProfileData, BookRecommendationsData } from "@/types/book";

import { BookHero } from "@/components/book-profile/BookHero";
import { BookRatingStats } from "@/components/book-profile/BookRatingStats";
import BookCarouselSection from "@/components/book-profile/BookCarouselSection";
import BookProfilePostsSection from "@/components/book-profile/BookProfilePostsSection";

interface BookProfilePageProps {
	params: Promise<{
		slug: string;
	}>;
}

export default async function BookProfilePage({
	params,
}: BookProfilePageProps) {
	const resolvedParams = await params;
	const slug = resolvedParams.slug;

	let bookData: BookProfileData | null = null;
	let recommendations: BookRecommendationsData | null = null;

	try {
		const [profileRes, recRes] = await Promise.all([
			getBookProfileAPI(slug),
			getBookRecommendationsAPI(slug),
		]);

		bookData = profileRes.data;
		recommendations = recRes.data;
	} catch (error) {
		notFound();
	}

	if (!bookData) {
		notFound();
	}

	return (
		<div className="w-full space-y-8 py-2 px-1">
			<BookHero book={bookData} />

			<BookRatingStats stats={bookData.stats} />

			{recommendations?.genre_recommendations && (
				<BookCarouselSection
					title="Buku Sejenis"
					description="Buku-buku dengan kombinasi genre serupa yang mungkin kamu nikmati."
					books={recommendations.genre_recommendations}
				/>
			)}

			{recommendations?.author_recommendations && (
				<BookCarouselSection
					title="Karya Lain Penulis"
					description={`Koleksi buku berharga lainnya yang ditulis oleh ${bookData.authors?.[0]?.author_name || "penulis yang sama"}.`}
					books={recommendations.author_recommendations}
				/>
			)}

			{/* SEKAT LINE PEMBATAS SEBELUM TAB POSTS */}
			<div className="border-t border-white/[0.04] pt-2" />

			{/* RENDER DUA TAB POSTINGAN REVIEW & ANALYSIS */}
			<BookProfilePostsSection
				slug={slug}
				bookTitle={bookData.title}
				bookId={bookData.book_id}
			/>
		</div>
	);
}
