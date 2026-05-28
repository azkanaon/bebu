"use client";

import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";

import { Check, ChevronDown } from "lucide-react";

interface Option {
	label: string;
	value: string;
}

interface FilterSelectProps {
	value: string;
	onChange: (value: string) => void;
	options: Option[];
	placeholder: string;
}

export default function FilterSelect({
	value,
	onChange,
	options,
	placeholder,
}: FilterSelectProps) {
	const selected =
		options.find((item) => item.value === value)?.label ?? placeholder;

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<button
					className="
						group relative
						flex h-10 items-center gap-2
						overflow-hidden rounded-2xl
						border border-white/10
						bg-black/20
						px-3.5
						text-[13px]
						font-medium
						text-zinc-300
						backdrop-blur-xl
						transition-all duration-200 ease-out
						hover:border-white/20
						hover:text-white
						data-[state=open]:border-blue-400/30
						data-[state=open]:shadow-[0_0_0_1px_rgba(96,165,250,0.15)]
					"
				>
					<div
						className="
							absolute inset-0 opacity-0
							bg-gradient-to-r
							from-blue-500/[0.03]
							to-indigo-500/[0.03]
							transition-opacity duration-300
							group-hover:opacity-100
							group-data-[state=open]:opacity-100
						"
					/>

					<span className="relative whitespace-nowrap">
						{selected}
					</span>

					<ChevronDown
						size={14}
						className="
							relative text-zinc-500
							transition-all duration-200
							group-hover:text-zinc-300
							group-data-[state=open]:rotate-180
							group-data-[state=open]:text-blue-300
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
						overflow-hidden rounded-2xl
						border border-white/10
						bg-[#0B1120]/92
						p-1.5
						backdrop-blur-2xl
						shadow-2xl shadow-black/40
						animate-in fade-in-0 zoom-in-95
						duration-200
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
											group/item
											flex w-full items-center justify-between
											rounded-xl
											px-3 py-2
											text-sm
											transition-all duration-150
										`,
										isActive
											? `
												border border-blue-500/15
												bg-blue-500/[0.08]
												text-blue-100
											`
											: `
												text-zinc-300
												hover:bg-white/[0.04]
												hover:text-white
											`,
									)}
								>
									<span>{item.label}</span>

									<Check
										size={14}
										className={clsx(
											`
												transition-all duration-150
											`,
											isActive
												? `
													opacity-100 scale-100 text-blue-300
												`
												: `
													opacity-0 scale-75
												`,
										)}
									/>
								</button>
							);
						})}
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}