import { List, Grid2X2 } from "lucide-react";

type Props = {
	viewMode: "list" | "grid";
	setViewMode: (mode: "list" | "grid") => void;
};

export default function ViewToggle({ viewMode, setViewMode }: Props) {
	return (
		<div
			className="
				flex
				items-center
				gap-1
				rounded-2xl
				border
				border-white/10
				bg-[#0B1020]/80
				p-1
				backdrop-blur-xl
			"
		>
			<button
				onClick={() => setViewMode("list")}
				className={`
					flex items-center justify-center
					rounded-xl
					p-2.5
					transition-all
					${
						viewMode === "list"
							? "bg-blue-500 text-white"
							: "text-gray-400 hover:bg-white/5"
					}
				`}
			>
				<List size={18} />
			</button>

			<button
				onClick={() => setViewMode("grid")}
				className={`
					flex items-center justify-center
					rounded-xl
					p-2.5
					transition-all
					${
						viewMode === "grid"
							? "bg-blue-500 text-white"
							: "text-gray-400 hover:bg-white/5"
					}
				`}
			>
				<Grid2X2 size={18} />
			</button>
		</div>
	);
}
