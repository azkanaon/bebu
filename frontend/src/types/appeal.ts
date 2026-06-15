export interface AccountAppeal {
	account_appeal_id: number;
	user_id: number;
	admin_action_id: number | null;
	appeal_reason: string;
	evidence_url: string | null; // 💡 Tambahkan field ini (bisa null jika opsional)
	status: "Pending" | "Approved" | "Rejected";
	admin_notes: string | null;
	reviewed_by_admin_id: number | null;
	reviewed_at: string | null;
	created_at: string;
	updated_at: string;
}

// 💡 Menggunakan FormData karena payload berisi file binary dan teks bersamaan
export type CreateAppealRequest = FormData;

export interface CreateAppealResponse {
	message: string;
	data: AccountAppeal;
}
