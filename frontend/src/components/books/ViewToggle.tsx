"use client";

import { Grid2X2, Rows3 } from "lucide-react";
import clsx from "clsx";

type Props = {
	viewMode: "list" | "grid";
	setViewMode: (mode: "list" | "grid") => void;
};

const options = [
	{
		key: "list",
		label: "List",
		icon: Rows3,
	},
	{
		key: "grid",
		label: "Grid",
		icon: Grid2X2,
	},
] as const;

export default function ViewToggle({ viewMode, setViewMode }: Props) {
	return (
		<div
			className="
				inline-flex
				items-center
				gap-1

				rounded-xl

				border
				border-blue-400/[0.08]

				bg-[#0B1220]/65

				p-1

				backdrop-blur-xl
			"
		>
			{options.map((option) => {
				const isActive = viewMode === option.key;

				const Icon = option.icon;

				return (
					<button
						key={option.key}
						onClick={() => setViewMode(option.key)}
						className={clsx(
							`
								relative

								flex
								items-center
								gap-1.5

								rounded-lg

								px-2.5
								py-1.5

								text-xs
								font-medium

								transition-all
								duration-200
							`,
							isActive
								? `
									bg-blue-500/15

									text-blue-300

									ring-1
									ring-blue-400/20

									shadow-[0_0_16px_rgba(59,130,246,0.10)]
								`
								: `
									text-gray-400

									hover:bg-white/[0.03]
									hover:text-gray-200
								`,
						)}
					>
						{/* ACTIVE GLOW */}
						{isActive && (
							<div
								className="
									absolute
									inset-0

									rounded-lg

									bg-gradient-to-r
									from-blue-500/[0.08]
									to-cyan-400/[0.04]

									pointer-events-none
								"
							/>
						)}

						<Icon size={14} className="relative z-10" />

						<span className="relative z-10">{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}
