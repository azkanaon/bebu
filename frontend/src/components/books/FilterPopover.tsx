"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";

import { useMemo, useState } from "react";

import clsx from "clsx";

type FilterPopoverProps = {
	label: string;
	items: string[];
	selectedItem: string | null;
	onSelectItem: (value: string | null) => void;
};

export default function FilterPopover({
	label,
	items,
	selectedItem,
	onSelectItem,
}: FilterPopoverProps) {
	const [search, setSearch] = useState("");

	const filteredItems = useMemo(() => {
		return items.filter((item) =>
			item.toLowerCase().includes(search.toLowerCase()),
		);
	}, [items, search]);

	return (
		<Popover.Root>
			{/* TRIGGER */}
			<Popover.Trigger asChild>
				<button
					className="
						group

						inline-flex
						items-center
						gap-2

						h-9
						px-3.5

						rounded-xl

						border
						border-white/[0.06]

						bg-white/[0.03]

						backdrop-blur-xl

						text-sm
						text-gray-300

						transition-all
						duration-200

						hover:border-blue-400/25
						hover:bg-blue-500/[0.08]
						hover:shadow-[0_0_18px_rgba(59,130,246,0.10)]

						data-[state=open]:border-blue-400/30
						data-[state=open]:bg-blue-500/[0.10]
						data-[state=open]:shadow-[0_0_22px_rgba(59,130,246,0.14)]
					"
				>
					<span
						className="
							max-w-[140px]
							truncate
						"
					>
						{selectedItem || label}
					</span>

					<ChevronDown
						className="
							h-3.5
							w-3.5
							text-gray-500
							transition-transform
							duration-200

							group-data-[state=open]:rotate-180
						"
					/>
				</button>
			</Popover.Trigger>

			{/* CONTENT */}
			<Popover.Portal>
				<Popover.Content
					sideOffset={10}
					align="start"
					className="
						z-50

						w-[260px]

						overflow-hidden

						rounded-2xl

						border
						border-white/[0.08]

						bg-[#0B1120]/96

						backdrop-blur-2xl

						shadow-[0_18px_50px_rgba(0,0,0,0.45)]

						animate-in
						fade-in
						zoom-in-95
					"
				>
					{/* SEARCH */}
					<div
						className="
							border-b
							border-white/[0.06]
							p-2
						"
					>
						<div
							className="
								flex
								items-center
								gap-2

								rounded-xl

								border
								border-white/[0.06]

								bg-white/[0.03]

								px-3

								focus-within:border-blue-400/25
							"
						>
							<Search
								className="
									h-3.5
									w-3.5
									text-gray-500
								"
							/>

							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder={`Search ${label.toLowerCase()}`}
								className="
									h-9
									w-full
									bg-transparent

									text-sm
									text-gray-200

									placeholder:text-gray-500

									outline-none
								"
							/>
						</div>
					</div>

					{/* LIST */}
					<div
						className="
							max-h-[280px]
							overflow-y-auto
							custom-scrollbar
							p-1.5
						"
					>
						{/* ALL OPTION */}
						<button
							onClick={() => onSelectItem(null)}
							className={clsx(
								`
									group/item

									flex
									w-full
									items-center
									justify-between

									rounded-xl

									px-3
									py-2.5

									text-sm

									transition-colors
								`,
								selectedItem === null
									? `
										bg-blue-500/[0.14]
										text-blue-200
										shadow-[0_0_12px_rgba(59,130,246,0.12)]
									`
									: `
										text-gray-300
										hover:bg-white/[0.04]
									`,
							)}
						>
							<span>All {label}</span>

							{selectedItem === null && (
								<Check
									className="
										h-4
										w-4
									"
								/>
							)}
						</button>

						{/* ITEMS */}
						{filteredItems.map((item) => {
							const isSelected = selectedItem === item;

							return (
								<button
									key={item}
									onClick={() => onSelectItem(item)}
									className={clsx(
										`
											group/item

											flex
											w-full
											items-center
											justify-between

											rounded-xl

											px-3
											py-2.5

											text-sm

											transition-colors
										`,
										isSelected
											? `
												bg-blue-500/[0.14]
												text-blue-200
												shadow-[0_0_12px_rgba(59,130,246,0.12)]
											`
											: `
												text-gray-300
												hover:bg-white/[0.04]
											`,
									)}
								>
									<span
										className="
											truncate
										"
									>
										{item}
									</span>

									{isSelected && (
										<Check
											className="
												h-4
												w-4
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
