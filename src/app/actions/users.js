"use server";

import bcrypt from "bcryptjs";
import { query, withTransaction } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

async function requireAdmin() {
  const admin = await getActiveUser("admin");

  if (!admin) {
    throw new Error("Akses ditolak. Hanya Admin yang dapat mengelola pengguna.");
  }

  return admin;
}

function validateUser(data, isCreate = false) {
  const nama = String(data.nama || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const noHp = String(data.no_hp || "").trim();
  const role = String(data.role || "").trim();
  const status = String(data.status || "").trim();

  if (!nama || !email || !role || !status) {
    throw new Error("Nama, email, role, dan status wajib diisi.");
  }

  if (nama.length > 100) {
    throw new Error("Nama maksimal 100 karakter.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Format email tidak valid.");
  }

  if (email.length > 150) {
    throw new Error("Email maksimal 150 karakter.");
  }

  if (noHp && noHp.length > 20) {
    throw new Error("Nomor HP maksimal 20 karakter.");
  }

  if (!["admin", "librarian", "member"].includes(role)) {
    throw new Error("Role pengguna tidak valid.");
  }

  if (!["active", "pending", "rejected", "suspended"].includes(status)) {
    throw new Error("Status pengguna tidak valid.");
  }

  const password = String(data.password || "");

  if (isCreate && password.length < 8) {
    throw new Error("Password minimal 8 karakter.");
  }

  if (!isCreate && password && password.length < 8) {
    throw new Error("Password baru minimal 8 karakter.");
  }

  const nomorIdentitas = String(data.nomor_identitas || "").trim();

  if (role === "member" && !nomorIdentitas) {
    throw new Error("Nomor identitas mahasiswa wajib diisi.");
  }

  if (role === "member" && nomorIdentitas.length > 30) {
    throw new Error("Nomor identitas maksimal 30 karakter.");
  }

  if (status === "rejected" && !String(data.alasan_penolakan || "").trim()) {
    throw new Error("Alasan penolakan wajib diisi.");
  }

  return {
    nama,
    email,
    noHp: noHp || null,
    role,
    status,
    password,
    nomorIdentitas,
    alasanPenolakan:
      status === "rejected"
        ? String(data.alasan_penolakan).trim()
        : null,
  };
}

// GET ALL USERS
export async function getUsers() {
  await requireAdmin();

  return query(`
    SELECT
      u.id,
      u.nama,
      u.email,
      u.no_hp,
      u.role,
      u.status,
      u.alasan_penolakan,
      u.created_at,
      m.id AS member_id,
      m.nomor_anggota,
      m.nomor_identitas,
      m.alamat
    FROM users u
    LEFT JOIN members m ON m.user_id = u.id
    ORDER BY u.created_at DESC
  `);
}

// CREATE USER
export async function createUser(data) {
  await requireAdmin();

  const user = validateUser(data, true);
  const passwordHash = await bcrypt.hash(user.password, 10);

  try {
    return await withTransaction(async (client) => {
      const result = await client.query(
        `
        INSERT INTO users (
          nama,
          email,
          password_hash,
          no_hp,
          role,
          status,
          alasan_penolakan
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, nama, email, role, status
        `,
        [
          user.nama,
          user.email,
          passwordHash,
          user.noHp,
          user.role,
          user.status,
          user.alasanPenolakan,
        ]
      );

      const newUser = result.rows[0];

      if (user.role === "member") {
        await client.query(
          `
          INSERT INTO members (
            user_id,
            nomor_identitas
          )
          VALUES ($1, $2)
          `,
          [newUser.id, user.nomorIdentitas]
        );
      }

      return {
        success: true,
        data: newUser,
      };
    });
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Email atau nomor identitas sudah digunakan.");
    }

    throw new Error(error.message || "Gagal membuat akun pengguna.");
  }
}

// UPDATE USER
export async function updateUser(id, data) {
  const admin = await requireAdmin();

  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("ID pengguna tidak valid.");
  }

  if (String(admin.id) === String(userId)) {
    throw new Error("Admin tidak dapat mengedit akunnya sendiri.");
  }

  const user = validateUser(data, false);

  try {
    return await withTransaction(async (client) => {
      const existing = await client.query(
        `
        SELECT u.id, u.role
        FROM users u
        WHERE u.id = $1
        FOR UPDATE
        `,
        [userId]
      );

      if (existing.rows.length === 0) {
        throw new Error("Pengguna tidak ditemukan.");
      }

      const oldRole = existing.rows[0].role;

      if (oldRole !== user.role) {
        const history = await client.query(
          `
          SELECT COUNT(*)::int AS total
          FROM loans l
          JOIN members m ON m.id = l.member_id
          WHERE m.user_id = $1
          `,
          [userId]
        );

        if (history.rows[0].total > 0) {
          throw new Error(
            "Role tidak dapat diubah karena pengguna memiliki riwayat transaksi."
          );
        }
      }

      const duplicate = await client.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
          AND id <> $2
        `,
        [user.email, userId]
      );

      if (duplicate.rows.length > 0) {
        throw new Error("Email sudah digunakan pengguna lain.");
      }

      const passwordHash = user.password
        ? await bcrypt.hash(user.password, 10)
        : null;

      await client.query(
        `
        UPDATE users
        SET
          nama = $1,
          email = $2,
          no_hp = $3,
          role = $4,
          status = $5,
          alasan_penolakan = $6,
          password_hash = COALESCE($7, password_hash),
          updated_at = NOW()
        WHERE id = $8
        `,
        [
          user.nama,
          user.email,
          user.noHp,
          user.role,
          user.status,
          user.alasanPenolakan,
          passwordHash,
          userId,
        ]
      );

      if (user.role === "member") {
        const member = await client.query(
          `
          SELECT id
          FROM members
          WHERE user_id = $1
          `,
          [userId]
        );

        if (member.rows.length === 0) {
          await client.query(
            `
            INSERT INTO members (
              user_id,
              nomor_identitas
            )
            VALUES ($1, $2)
            `,
            [userId, user.nomorIdentitas]
          );
        } else {
          await client.query(
            `
            UPDATE members
            SET nomor_identitas = $1,
                updated_at = NOW()
            WHERE user_id = $2
            `,
            [user.nomorIdentitas, userId]
          );
        }
      }

      return { success: true };
    });
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Email atau nomor identitas sudah digunakan.");
    }

    throw new Error(error.message || "Gagal memperbarui pengguna.");
  }
}

// DELETE USER
export async function deleteUser(id) {
  const admin = await requireAdmin();

  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("ID pengguna tidak valid.");
  }

  if (String(admin.id) === String(userId)) {
    throw new Error("Admin tidak dapat menghapus akunnya sendiri.");
  }

  try {
    return await withTransaction(async (client) => {
      const existing = await client.query(
        `
        SELECT id, role
        FROM users
        WHERE id = $1
        FOR UPDATE
        `,
        [userId]
      );

      if (existing.rows.length === 0) {
        throw new Error("Pengguna tidak ditemukan.");
      }

      const history = await client.query(
        `
        SELECT COUNT(*)::int AS total
        FROM loans l
        JOIN members m ON m.id = l.member_id
        WHERE m.user_id = $1
        `,
        [userId]
      );

      if (history.rows[0].total > 0) {
        throw new Error(
          "Pengguna tidak dapat dihapus karena memiliki riwayat transaksi. Ubah status akunnya menjadi suspended."
        );
      }

      await client.query(
        `DELETE FROM users WHERE id = $1`,
        [userId]
      );

      return { success: true };
    });
  } catch (error) {
    if (error.code === "23503") {
      throw new Error(
        "Pengguna masih terhubung dengan data lain dan tidak dapat dihapus."
      );
    }

    throw new Error(error.message || "Gagal menghapus pengguna.");
  }
}
