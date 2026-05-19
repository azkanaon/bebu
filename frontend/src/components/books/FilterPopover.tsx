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
			<Popover.Trigger asChild>
				<button
					className="
						flex-1
						flex
						items-center
						justify-center
						gap-2
						px-5
						py-3.5
						rounded-2xl
						bg-[#0F172A]/80
						backdrop-blur-xl
						border
						border-white/10
						text-white
						hover:border-blue-400/40
						hover:bg-blue-500/10
						transition-all
						duration-300
					"
				>
					<span className="truncate">{selectedItem || label}</span>

					<ChevronDown className="w-4 h-4 opacity-70" />
				</button>
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Content
					sideOffset={10}
					align="end"
					className="
            z-50
            w-[280px]
            rounded-2xl
            border
            border-white/10
            bg-[#0B1120]/95
            backdrop-blur-2xl
            shadow-2xl
            shadow-blue-900/20
            overflow-hidden
            animate-in
            fade-in
            zoom-in-95
          "
				>
					{/* SEARCH */}
					<div className="relative border-b border-white/5">
						<Search
							className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                w-4
                h-4
                text-gray-500
              "
						/>

						<input
							type="text"
							placeholder={`Search ${label.toLowerCase()}...`}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="
                w-full
                bg-transparent
                text-white
                placeholder:text-gray-500
                pl-10
                pr-4
                py-3
                outline-none
              "
						/>
					</div>

					{/* LIST */}
					<div className="max-h-[300px] overflow-y-auto p-2">
						<button
							onClick={() => onSelectItem(null)}
							className={clsx(
								`
                  w-full
                  flex
                  items-center
                  justify-between
                  px-3
                  py-2.5
                  rounded-xl
                  text-sm
                  transition-all
                `,
								selectedItem === null
									? "bg-blue-500/15 text-blue-300"
									: "text-gray-300 hover:bg-white/5",
							)}
						>
							<span>All {label}</span>

							{selectedItem === null && (
								<Check className="w-4 h-4" />
							)}
						</button>

						{filteredItems.map((item) => {
							const isSelected = selectedItem === item;

							return (
								<button
									key={item}
									onClick={() => onSelectItem(item)}
									className={clsx(
										`
                      w-full
                      flex
                      items-center
                      justify-between
                      px-3
                      py-2.5
                      rounded-xl
                      text-sm
                      transition-all
                    `,
										isSelected
											? "bg-blue-500/15 text-blue-300"
											: "text-gray-300 hover:bg-white/5",
									)}
								>
									<span>{item}</span>

									{isSelected && (
										<Check className="w-4 h-4" />
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
