import axios from 'axios'

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    // 1. Cek jika backend mengirim pesan error spesifik
    // Biasanya Go (Gin/Echo) mengirim format { "message": "..." } atau { "error": "..." }
    const serverMessage =
      error.response?.data?.message || error.response?.data?.error

    if (error.response?.status === 429) {
      return 'Terlalu banyak percobaan login. Silakan tunggu 1 menit.'
    }

    if (error.response?.status === 401) {
      return 'Email atau password salah.'
    }

    return serverMessage || 'Terjadi kesalahan pada server.'
  }

  return 'Koneksi internet terputus atau error tidak diketahui.'
}
