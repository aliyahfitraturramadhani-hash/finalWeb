"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import {
  createSession,
  deleteSession,
} from "@/lib/auth";

// LOGIN
export async function loginAction(formData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  try {
    const users = await query(
      `SELECT id, nama, email, password_hash, role, status
       FROM users
       WHERE LOWER(email) = $1`,
      [email]
    );

    const user = users[0];

    if (!user) {
      return { error: "Email atau password salah." };
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return { error: "Email atau password salah." };
    }

    // Akun yang ditangguhkan tidak boleh login
    if (user.status === "suspended") {
      return {
        error: "Akun kamu ditangguhkan dan tidak dapat digunakan.",
      };
    }

    // Hanya status yang dikenal yang boleh melanjutkan
    if (!["active", "pending", "rejected"].includes(user.status)) {
      return {
        error: "Status akun tidak dikenali.",
      };
    }

    // Membuat session
    await createSession(user);

    // Akun pending dan rejected diarahkan ke halaman status
    if (user.status === "pending" || user.status === "rejected") {
      redirect("/akun/status");
    }

    // Redirect berdasarkan role untuk akun aktif
    if (user.role === "admin") redirect("/admin");

    if (user.role === "librarian") redirect("/pegawai");

    if (user.role === "member") redirect("/mahasiswa");

    return {
      error: "Role pengguna tidak dikenali.",
    };

  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Login error:", error);

    return {
      error: "Terjadi kesalahan saat login. Silakan coba kembali.",
    };
  }
}

// REGISTER
export async function registerAction(formData) {
  const nama = String(formData.get("nama") || "").trim();

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") || "");

  const confirmPassword = String(
    formData.get("confirmPassword") || ""
  );

  const nomorIdentitas = String(
    formData.get("nomor_identitas") || ""
  ).trim();

  const alamat = String(formData.get("alamat") || "").trim();

  // Validasi kolom wajib
  if (!nama || !email || !password || !nomorIdentitas) {
    return { error: "Semua kolom wajib harus diisi." };
  }

  // Validasi format email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Format email tidak valid." };
  }

  // Validasi email kampus
  if (!/^[^\s@]+@[^\s@]+\.ac\.id$/i.test(email)) {
    return {
      error: "Gunakan email kampus dengan domain .ac.id.",
    };
  }

  // Validasi password
  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  // Validasi konfirmasi password
  if (password !== confirmPassword) {
    return {
      error: "Password dan konfirmasi password tidak sama.",
    };
  }

  // Validasi nomor identitas
  if (!/^\d+$/.test(nomorIdentitas)) {
    return {
      error: "Nomor identitas harus berupa angka.",
    };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await query(
      `WITH new_user AS (
        INSERT INTO users
          (nama, email, password_hash, role, status)
        VALUES
          ($1, $2, $3, 'member', 'pending')
        RETURNING id
      )
      INSERT INTO members
        (user_id, nomor_identitas, alamat)
      SELECT
        id, $4, $5
      FROM new_user`,
      [
        nama,
        email,
        passwordHash,
        nomorIdentitas,
        alamat || null,
      ]
    );

    return {
      success: "Registrasi berhasil! Tunggu persetujuan admin.",
    };

  } catch (error) {
    // Unique constraint violation
    if (error.code === "23505") {
      return {
        error: "Email atau nomor identitas sudah digunakan.",
      };
    }

    console.error("Register error:", error);

    return {
      error: "Registrasi gagal. Silakan coba kembali.",
    };
  }
}
// LOGOUT
export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
