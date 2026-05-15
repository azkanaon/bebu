import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "./dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(utc);

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const base64ToBlob = (base64: string): Blob => {
	const byteString = atob(base64.split(",")[1]);
	const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
	const ab = new ArrayBuffer(byteString.length);
	const ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ab], { type: mimeString });
};

export function timeAgo(date: string) {
	const target = dayjs(date);
	const now = dayjs();

	const seconds = now.diff(target, "second");

	if (seconds < 5) return "just now";

	if (seconds < 60) return `${seconds}s`;

	const minutes = now.diff(target, "minute");
	if (minutes < 60) return `${minutes}m`;

	const hours = now.diff(target, "hour");
	if (hours < 24) return `${hours}h`;

	const days = now.diff(target, "day");
	if (days < 30) return `${days}d`;

	const months = now.diff(target, "month");
	if (months < 12) return `${months}mo`;

	const years = now.diff(target, "year");
	return `${years}y`;
}

export function formatCompactNumber(number: number): string {
	if (number === 0) return "0";

	return Intl.NumberFormat("en-US", {
		notation: "compact",
		compactDisplay: "short",
		maximumFractionDigits: 1,
	}).format(number);
}
