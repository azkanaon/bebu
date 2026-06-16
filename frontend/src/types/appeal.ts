/* --- USER RESPONSE --- */
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

// Request Types

export interface ActionAppealRequest {
  status: "Approved" | "Rejected";
  adminNotes: string;
}

/* --- ADMIN RESPONSE --- */

// Digunakan untuk baris data di tabel utama admin
export interface AdminAppealList {
  accountAppealID: number;
  username: string;
  displayName: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string; // ISO Date String dari Go
}

// Response bungkus standar backend Anda untuk data array
export interface AdminAppealListResponse {
  data: AdminAppealList[];
}

// Digunakan untuk isi detail di dalam Pop-up modal admin
export interface AdminAppealDetail {
  accountAppealID: number;
  userID: number;
  username: string;
  appealReason: string;
  evidenceURL?: string; // Optional karena di database bisa null
  status: "Pending" | "Approved" | "Rejected";
  suspensionReason: string;
  adminNotes?: string;
  reviewedByAdminID?: number;
  reviewedAt?: string;
  createdAt: string;
}

// Response bungkus standar backend Anda untuk data single object
export interface AdminAppealDetailResponse {
  data: AdminAppealDetail;
}

// Response standar setelah berhasil melakukan aksi (Terima/Tolak)
export interface ActionAppealResponse {
  message: string;
}
