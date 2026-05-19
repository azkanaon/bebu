type RangeType = "today" | "7d" | "30d" | "all";

type Props = {
	value: RangeType;
	onChange: (value: RangeType) => void;
};

export default function PopularRangeDropdown({ value, onChange }: Props) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value as RangeType)}
			className="
				rounded-xl
				border
				border-white/10
				bg-[#0B1020]
				px-4
				py-2
				text-sm
				text-gray-300
				outline-none
				transition-all
				focus:border-blue-500/40
			"
		>
			<option value="today">Yesterday</option>

			<option value="7d">Last 7 Days</option>

			<option value="30d">Last 30 Days</option>

			<option value="all">All Time</option>
		</select>
	);
}
