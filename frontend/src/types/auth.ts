export interface User {
  user_public_id: string
  username: string
  display_name: string
  avatar_url: string
  bio: string
  gender: string
  role: string
}

export interface LoginResponse {
  data: User // Data user ada di dalam sini
  message: string
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
