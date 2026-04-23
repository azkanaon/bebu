// src/types/auth.ts
export interface User {
  user_public_id: string
  username: string
  display_name: string
  avatar_url: string
  bio: string
  gender: string
}

export interface LoginResponse extends User {
  // Biasanya ada token, saya tambahkan sebagai opsional jika backend mengirimnya
  token?: string
}

// Request menggunakan snake_case sesuai tag JSON backend kamu
export interface LoginRequest {
  email_or_username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  display_name: string
  bio: string
  gender: string
  avatar: File | Blob // Kita kirim filenya
}
