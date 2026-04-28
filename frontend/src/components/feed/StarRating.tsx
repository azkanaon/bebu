"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function StarRating({
	value,
	onChange,
}: {
	value: number;
	onChange: (v: number) => void;
}) {
	const [hover, setHover] = useState(0);

	return (
		<div className="flex items-center gap-2">
			<div className="flex">
				{[1, 2, 3, 4, 5].map((i) => {
					const active = i <= (hover || value);

					return (
						<motion.span
							key={i}
							onClick={() => onChange(i)}
							onMouseEnter={() => setHover(i)}
							onMouseLeave={() => setHover(0)}
							whileHover={{ scale: 1.25 }}
							whileTap={{ scale: 0.9 }}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: i * 0.05,
								type: "spring",
								stiffness: 300,
							}}
							className="relative cursor-pointer text-3xl"
						>
							{/* Glow layer */}
							{active && (
								<motion.span
									layoutId="star-glow"
									className="absolute inset-0 blur-md"
									style={{
										background:
											"radial-gradient(circle, rgba(255,200,0,0.6), transparent 70%)",
									}}
								/>
							)}

							{/* Star */}
							<span
								className={`
relative z-10 transition
${
	active
		? "bg-gradient-to-br from-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(255,200,0,0.6)]"
		: "text-gray-600"
}
`}
							>
								★
							</span>
						</motion.span>
					);
				})}
			</div>

			{/* Optional label */}
			<motion.span
				key={hover || value}
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-sm text-gray-400 ml-2"
			>
				{hover || value ? `${hover || value}/5` : "Rate this book"}
			</motion.span>
		</div>
	);
}
