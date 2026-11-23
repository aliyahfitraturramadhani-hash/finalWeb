import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

const COOKIE_NAME = "booklyn_session";

// MEMBUAT SESSION
export async function createSession(user) {
  const token = await new SignJWT({
    userId: user.id,
    role: user.role,
    nama: user.nama,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

// MEMBACA SESSION
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// MEMERIKSA USER AKTIF BERDASARKAN DATABASE
// Mendukung satu role atau beberapa role sekaligus.
export async function getActiveUser(requiredRole) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const users = await query(
    `SELECT id, nama, email, role, status
     FROM users
     WHERE id = $1`,
    [session.userId]
  );

  const user = users[0];

  if (!user) {
    await deleteSession();
    redirect("/login");
  }

  if (user.status !== "active") {
    redirect("/akun/status");
  }

  const allowedRoles = requiredRole
    ? Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole]
    : null;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") redirect("/admin");
    if (user.role === "librarian") redirect("/pegawai");
    if (user.role === "member") redirect("/mahasiswa");

    redirect("/login");
  }

  return user;
}

// MENGHAPUS SESSION
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}