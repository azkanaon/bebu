"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, AlertTriangle, Copy, ShieldAlert } from "lucide-react";
import clsx from "clsx";

interface CategoryOption {
	value: string;
	label: string;
	icon: React.ComponentType<{ size: number; className?: string }>;
}

interface RejectionCategorySelectProps {
	value: string;
	onChange: (val: string) => void;
}

const CATEGORIES: CategoryOption[] = [
	{
		value: "incomplete",
		label: "Incomplete Book Information",
		icon: AlertTriangle,
	},
	{
		value: "duplicate",
		label: "Duplicate Book Entry",
		icon: Copy,
	},
	{
		value: "spam",
		label: "Spam or Invalid Submission",
		icon: ShieldAlert,
	},
];

export default function RejectionCategorySelect({
	value,
	onChange,
}: RejectionCategorySelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Tutup dropdown jika klik di luar area komponen
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const selectedOption =
		CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];
	const SelectedIcon = selectedOption.icon;

	return (
		<div ref={containerRef} className="relative w-full">
			{/* TOMBOL UTAMA DROPDOWN */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={clsx(
					"flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs transition-all duration-300 outline-none",
					isOpen
						? "border-rose-500/40 bg-rose-500/[0.02] text-white shadow-lg shadow-rose-500/[0.02]"
						: "border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/20 hover:bg-white/[0.04]",
				)}
			>
				<div className="flex items-center gap-2.5">
					<SelectedIcon size={14} className="text-rose-400" />
					<span className="font-medium">{selectedOption.label}</span>
				</div>
				<ChevronDown
					size={14}
					className={clsx(
						"text-zinc-500 transition-transform duration-300",
						isOpen && "rotate-180 text-rose-400",
					)}
				/>
			</button>

			{/* MENU OPSI LIST */}
			{isOpen && (
				<div className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/10 bg-[#09090B]/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
					{CATEGORIES.map((category) => {
						const OptionIcon = category.icon;
						const isSelected = category.value === value;

						return (
							<button
								key={category.value}
								type="button"
								onClick={() => {
									onChange(category.value);
									setIsOpen(false);
								}}
								className={clsx(
									"flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-all duration-150",
									isSelected
										? "bg-rose-500/10 text-rose-400 font-medium"
										: "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
								)}
							>
								<OptionIcon
									size={13}
									className={clsx(
										isSelected
											? "text-rose-400"
											: "text-zinc-500",
									)}
								/>
								<span>{category.label}</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}