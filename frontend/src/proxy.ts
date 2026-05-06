import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 1. Tentukan route mana saja yang diproteksi dan mana yang untuk publik
const protectedRoutes = ['/profile', '/settings', '/dashboard', '/chat'] // Tambah sesuai kebutuhan
const authRoutes = ['/login', '/register', '/reset-password']

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // 1. Tambahkan Security Headers
  const headers = response.headers

  // Mencegah website kamu dibungkus dalam <iframe> oleh website lain (Clickjacking)
  headers.set('X-Frame-Options', 'DENY')

  // Memaksa browser menggunakan HTTPS
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  )

  // Mencegah browser menebak-nebak tipe file (MIME Sniffing)
  headers.set('X-Content-Type-Options', 'nosniff')

  // Perlindungan XSS dasar untuk browser lama
  headers.set('X-XSS-Protection', '1; mode=block')

  // --- Logika Redirect yang tadi ---
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Redirect untuk path route
  const isRootPath = pathname === '/'
  const isProtectedRoute =
    isRootPath || protectedRoutes.some((route) => pathname.startsWith(route))

  // 3. LOGIKA A: Jika user BELUM login tapi mencoba akses halaman TERPROTEKSI
  if (
    !token &&
    (isProtectedRoute ||
      protectedRoutes.some((route) => pathname.startsWith(route)))
  ) {
    // Redirect ke halaman login
    const loginUrl = new URL('/login', request.url)
    // (Opsional) Simpan halaman asal agar setelah login bisa kembali ke sini
    // loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl)
  }

  // 4. LOGIKA B: Jika user SUDAH login tapi mencoba akses halaman AUTH (login/register)
  if (token && authRoutes.some((route) => pathname.startsWith(route))) {
    // Tendang ke halaman profile atau home
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 5. Jika semua aman, izinkan request berlanjut
  return NextResponse.next()
}

// 6. Konfigurasi Matcher: Agar middleware tidak berjalan di file statis (gambar, favicon, dll)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image (folder public/image kamu)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|image|Logo.png).*)',
  ],
}
