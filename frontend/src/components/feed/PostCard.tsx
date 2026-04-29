import { ReviewPostType, AnalysisPostType } from "@/types/post";
import ReviewPost from "./ReviewPost";
import AnalysisPost from "./AnalysisPost";

type Props = {
	post: ReviewPostType | AnalysisPostType;
};

export default function PostCard({ post }: Props) {
	if (post.type === "review") {
		return <ReviewPost post={post} />;
	}
	return <AnalysisPost post={post} />;
}
