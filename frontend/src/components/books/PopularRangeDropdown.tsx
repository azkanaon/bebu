"use client";

import * as Popover from "@radix-ui/react-popover";

import { Check, ChevronDown, CalendarClock } from "lucide-react";

import clsx from "clsx";

type RangeType = "today" | "7d" | "30d" | "all";

type Props = {
	value: RangeType;
	onChange: (value: RangeType) => void;
};

const options = [
	{
		value: "today",
		label: "Yesterday",
	},
	{
		value: "7d",
		label: "Last 7 Days",
	},
	{
		value: "30d",
		label: "Last 30 Days",
	},
	{
		value: "all",
		label: "All Time",
	},
] as const;

export default function PopularRangeDropdown({ value, onChange }: Props) {
	const selected = options.find((o) => o.value === value);

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<button
					className="
						group

						flex
						items-center
						justify-between
						gap-2

						min-w-[150px]
						rounded-xl

						border
						border-white/10

						bg-white/[0.03]

						px-3
						py-1.5

						text-[13px]
						text-gray-300

						backdrop-blur-xl

						transition-all
						duration-200

						hover:border-blue-500/30
						hover:bg-blue-500/[0.06]
						hover:text-white
					"
				>
					<CalendarClock
						size={14}
						className="
							text-blue-300/80
							transition-colors
							group-hover:text-blue-300
						"
					/>

					<span className="font-medium">{selected?.label}</span>

					<ChevronDown
						size={14}
						className="
							opacity-60
							transition-transform
							duration-200
							group-data-[state=open]:rotate-180
						"
					/>
				</button>
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Content
					sideOffset={10}
					align="end"
					className="
						z-50
						min-w-[190px]

						overflow-hidden

						rounded-2xl

						border
						border-white/[0.08]

						bg-[#0B1120]/96

						p-1.5

						backdrop-blur-2xl

						shadow-[0_10px_40px_rgba(0,0,0,0.45)]

						animate-in
						fade-in
						zoom-in-95
					"
				>
					<div className="space-y-1">
						{options.map((option) => {
							const isSelected = option.value === value;

							return (
								<button
									key={option.value}
									onClick={() => onChange(option.value)}
									className={clsx(
										`
											flex
											w-full
											items-center
											justify-between

											rounded-xl

											px-3
											py-2

											text-[13px]

											transition-all
											duration-200
										`,
										isSelected
											? `
												bg-blue-500/[0.10]
												text-blue-200
											`
											: `
												text-gray-300
												hover:bg-white/[0.04]
												hover:text-white
											`,
									)}
								>
									<span className="font-medium">
										{option.label}
									</span>

									{isSelected && (
										<Check
											size={14}
											className="
												text-blue-300
											"
										/>
									)}
								</button>
							);
						})}
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
