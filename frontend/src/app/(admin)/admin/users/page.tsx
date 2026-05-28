"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, ShieldCheck, UserX, ShieldAlert } from "lucide-react";

import { getUserManagementAPIs } from "@/lib/api";
import {
	UserManageableResponse,
	UserQueryParams,
} from "@/types/user-management";

import UserFilterBar from "@/components/user-management/UserFilterBar";
import UserTable from "@/components/user-management/UserTable";
import UserStatusModal from "@/components/user-management/UserStatusModal";

export default function UserManagementPage() {
	const [users, setUsers] = useState<UserManageableResponse[]>([]);
	const [loading, setLoading] = useState(true);

	// State untuk kontrol modal penanganan status user
	const [selectedUser, setSelectedUser] =
		useState<UserManageableResponse | null>(null);

	// State Pagination Metadata
	const [totalCount, setTotalCount] = useState<number>(0);
	const [totalPages, setTotalPages] = useState<number>(1);

	// Filter State Grouping
	const [filters, setFilters] = useState<UserQueryParams>({
		search: "",
		status: "", // Default menampilkan semua status
		role: "",
		page: 1,
		limit: 10,
	});

	const handleFilterChange = (
		key: keyof UserQueryParams,
		value: string | number,
	) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
			page: key === "page" ? (value as number) : 1,
		}));
	};

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const response = await getUserManagementAPIs(filters);

			setUsers(response.data);
			setTotalCount(response.total_count);
			setTotalPages(response.total_pages);
		} catch (err) {
			console.error("Failed to load admin user dashboard", err);
		} finally {
			setLoading(false);
		}
	}, [filters]);

	// Efek samping untuk reload data dengan trigger debounce 300ms untuk mengetik search
	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			fetchUsers();
		}, 300);

		return () => clearTimeout(delayDebounce);
	}, [
		filters.search,
		filters.status,
		filters.role,
		filters.page,
		fetchUsers,
	]);

	return (
		<div className="relative min-h-screen overflow-hidden">
			{/* Ambient Background Glow */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-[-120px] right-[15%] h-[320px] w-[320px] rounded-full bg-purple-500/10 blur-3xl" />
				<div className="absolute bottom-[-150px] left-[10%] h-[280px] w-[280px] rounded-full bg-blue-500/10 blur-3xl" />
			</div>

			<div className="relative z-10 space-y-6 py-6">
				{/* HEADER */}
				<div className="flex items-start justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-purple-400/70">
							Administration Control
						</p>

						<h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
							User Directory & Identity
						</h1>

						<p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
							Manage user lifecycles, adjust permissions,
							investigate accounts, and restrict access
							permissions across the BeBu network.
						</p>
					</div>
				</div>

				{/* CONTENT BLOCK CONTAINER */}
				<div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
					<div className="space-y-5">
						<UserFilterBar
							filters={filters}
							onFilterChange={handleFilterChange}
						/>

						<UserTable
							data={users}
							loading={loading}
							onSelect={(user) => setSelectedUser(user)}
							currentPage={filters.page}
							totalPages={totalPages}
							totalItems={totalCount}
							onPageChange={(newPage) =>
								handleFilterChange("page", newPage)
							}
						/>
					</div>
				</div>

				{/* MODAL POPUP MODERASI STATUS */}
				<UserStatusModal
					user={selectedUser}
					onClose={() => setSelectedUser(null)}
					onActionSuccess={fetchUsers}
				/>
			</div>
		</div>
	);
}
