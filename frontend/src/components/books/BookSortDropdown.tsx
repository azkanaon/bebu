"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

type SortType = "title" | "newest" | "rating" | "popular";

type Props = {
	value: SortType;
	onChange: (value: SortType) => void;
};

const options: {
	label: string;
	value: SortType;
}[] = [
	{
		label: "Alphabetical",
		value: "title",
	},
	{
		label: "Newest",
		value: "newest",
	},
	{
		label: "Highest Rated",
		value: "rating",
	},
	{
		label: "Most Popular",
		value: "popular",
	},
];

export default function BookSortDropdown({ value, onChange }: Props) {
	const selected =
		options.find((item) => item.value === value)?.label ?? "Sort";

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<button
					className="
						group

						flex
						h-9
						items-center
						gap-2

						rounded-xl

						border
						border-white/10

						bg-white/[0.03]

						px-3

						text-[13px]
						font-medium
						text-gray-300

						transition-all
						duration-200

						hover:border-blue-500/35
						hover:bg-blue-500/[0.10]
					"
				>
					<span className="whitespace-nowrap">{selected}</span>

					<ChevronDown
						size={14}
						className="
							text-gray-400
							transition-transform
							duration-200
							group-data-[state=open]:rotate-180
						"
					/>
				</button>
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Content
					sideOffset={8}
					align="end"
					className="
						z-50

						w-[190px]

						overflow-hidden

						rounded-2xl

						border
						border-white/10

						bg-[#0B1120]/95

						p-1.5

						backdrop-blur-2xl

						shadow-2xl
						shadow-black/40

						animate-in
						fade-in-0
						zoom-in-95
					"
				>
					<div className="space-y-1">
						{options.map((item) => {
							const isActive = item.value === value;

							return (
								<button
									key={item.value}
									onClick={() => onChange(item.value)}
									className={clsx(
										`
											flex
											w-full
											items-center
											justify-between

											rounded-xl

											px-3
											py-2

											text-sm

											transition-all
											duration-150
										`,
										isActive
											? `
												bg-blue-500/15
												text-blue-200
												border
												border-blue-500/20
											`
											: `
												text-gray-300
												hover:bg-white/[0.04]
												hover:text-white
											`,
									)}
								>
									<span>{item.label}</span>

									{isActive && <Check size={14} />}
								</button>
							);
						})}
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}