import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Nama cookie session BOOKLYN
const COOKIE_NAME = "booklyn_session";

// Secret untuk memverifikasi JWT
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

// ========================================
// PROXY - AUTHENTICATION & AUTHORIZATION
// ========================================

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Mengambil session dari cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Jika belum login
  if (!token) {
    const loginUrl = new URL("/login", request.url);

    return NextResponse.redirect(loginUrl);
  }

  try {
    // Memverifikasi JWT
    const { payload } = await jwtVerify(token, secret);

    const role = payload.role;

    // ====================================
    // ADMIN
    // ====================================

    if (pathname.startsWith("/admin")) {
      if (role !== "admin") {
        return redirectByRole(role, request);
      }
    }

    // ====================================
    // PEGAWAI PERPUSTAKAAN
    // ====================================

    if (pathname.startsWith("/pegawai")) {
      if (role !== "librarian") {
        return redirectByRole(role, request);
      }
    }

    // ====================================
    // MAHASISWA
    // ====================================

    if (pathname.startsWith("/mahasiswa")) {
      if (role !== "member") {
        return redirectByRole(role, request);
      }
    }

    // Jika session valid dan role sesuai
    return NextResponse.next();

  } catch (error) {
    // Session tidak valid atau kedaluwarsa
    console.error("Session verification failed:", error);

    const loginUrl = new URL("/login", request.url);

    const response = NextResponse.redirect(loginUrl);

    // Hapus cookie yang tidak valid
    response.cookies.delete(COOKIE_NAME);

    return response;
  }
}


// ========================================
// REDIRECT BERDASARKAN ROLE
// ========================================

function redirectByRole(role, request) {
  let destination = "/login";

  if (role === "admin") {
    destination = "/admin";
  }

  if (role === "librarian") {
    destination = "/pegawai";
  }

  if (role === "member") {
    destination = "/mahasiswa";
  }

  return NextResponse.redirect(
    new URL(destination, request.url)
  );
}


// ========================================
// PROXY CONFIGURATION
// ========================================

export const config = {
  matcher: [
    "/admin/:path*",
    "/pegawai/:path*",
    "/mahasiswa/:path*",
  ],
};