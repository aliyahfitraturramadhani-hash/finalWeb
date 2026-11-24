"use server";

import { query, withTransaction } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

export async function getFines(keyword = "", statusFilter = "") {
  await getActiveUser("librarian");

  const params = [];
  const conditions = [];

  // Filter status denda
  if (statusFilter && statusFilter !== "semua") {
    params.push(statusFilter);
    conditions.push(`f.status = $${params.length}`);
  }

  // Pencarian data
  const search = keyword.trim();

  if (search) {
    params.push(`%${search}%`);
    const searchParam = `$${params.length}`;

    conditions.push(`
      (
        m.nomor_anggota ILIKE ${searchParam}
        OR u.nama ILIKE ${searchParam}
        OR u.email ILIKE ${searchParam}
        OR b.judul ILIKE ${searchParam}
        OR l.kode_pinjam ILIKE ${searchParam}
      )
    `);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await query(
    `
      SELECT
        f.id,
        f.loan_item_id,
        f.jenis,
        f.hari_terlambat,
        f.tarif_per_hari,
        f.jumlah_denda,
        f.status,
        f.alasan_penghapusan,
        f.dibayar_at,
        f.created_at,

        m.nomor_anggota,
        u.nama AS nama_mahasiswa,
        u.email,

        b.judul,
        bc.kode_eksemplar,
        l.kode_pinjam

      FROM fines f

      JOIN loan_items li
        ON li.id = f.loan_item_id

      JOIN loans l
        ON l.id = li.loan_id

      JOIN book_copies bc
        ON bc.id = li.copy_id

      JOIN books b
        ON b.id = bc.book_id

      JOIN members m
        ON m.id = l.member_id

      JOIN users u
        ON u.id = m.user_id

      ${whereClause}

      ORDER BY
        CASE
          WHEN f.status = 'belum_dibayar' THEN 0
          WHEN f.status = 'lunas' THEN 1
          ELSE 2
        END,
        f.created_at DESC
    `,
    params
  );

  return result;
}


// PEMBAYARAN DENDA
export async function payFine(fineId) {
  const user = await getActiveUser("librarian");

  return await withTransaction(async (client) => {
    const result = await client.query(
      `
        SELECT id, status
        FROM fines
        WHERE id = $1
        FOR UPDATE
      `,
      [fineId]
    );

    if (!result.rows.length) {
      throw new Error("Data denda tidak ditemukan.");
    }

    if (result.rows[0].status !== "belum_dibayar") {
      throw new Error("Denda ini tidak dapat dibayar.");
    }

    await client.query(
      `
        UPDATE fines
        SET
          status = 'lunas',
          processed_by = $2,
          dibayar_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [fineId, user.id]
    );

    return { success: true };
  });
}


// PENGHAPUSAN DENDA
export async function waiveFine(fineId, alasan) {
  const user = await getActiveUser("librarian");

  const reason = alasan?.trim();

  if (!reason) {
    throw new Error("Alasan penghapusan denda wajib diisi.");
  }

  return await withTransaction(async (client) => {
    const result = await client.query(
      `
        SELECT id, status
        FROM fines
        WHERE id = $1
        FOR UPDATE
      `,
      [fineId]
    );

    if (!result.rows.length) {
      throw new Error("Data denda tidak ditemukan.");
    }

    if (result.rows[0].status !== "belum_dibayar") {
      throw new Error("Denda ini tidak dapat dihapuskan.");
    }

    await client.query(
      `
        UPDATE fines
        SET
          status = 'dihapuskan',
          alasan_penghapusan = $2,
          processed_by = $3
        WHERE id = $1
      `,
      [fineId, reason, user.id]
    );

    return { success: true };
  });
}