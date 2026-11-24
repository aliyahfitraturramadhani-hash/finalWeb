"use server";

import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getActiveUser("admin");

  if (!user) {
    throw new Error(
      "Akses ditolak. Hanya Admin yang dapat mengelola kategori."
    );
  }

  return user;
}

function validateCategory(data) {
  const nama = String(data.nama_kategori || "").trim();
  const kode = String(data.kode_klasifikasi || "").trim();
  const deskripsi = String(data.deskripsi || "").trim();

  if (!nama) {
    throw new Error("Nama kategori wajib diisi.");
  }

  if (nama.length > 100) {
    throw new Error("Nama kategori maksimal 100 karakter.");
  }

  if (kode.length > 50) {
    throw new Error("Kode klasifikasi maksimal 50 karakter.");
  }

  return {
    nama,
    kode: kode || null,
    deskripsi: deskripsi || null,
  };
}

// GET ALL CATEGORIES
export async function getCategories() {
  await requireAdmin();

  return query(`
    SELECT
      c.id,
      c.nama_kategori,
      c.kode_klasifikasi,
      c.deskripsi,
      COUNT(DISTINCT bc.book_id)::int AS jumlah_buku
    FROM categories c
    LEFT JOIN book_categories bc
      ON bc.category_id = c.id
    GROUP BY
      c.id,
      c.nama_kategori,
      c.kode_klasifikasi,
      c.deskripsi
    ORDER BY c.nama_kategori ASC
  `);
}

// CREATE CATEGORY
export async function createCategory(data) {
  await requireAdmin();

  const { nama, kode, deskripsi } = validateCategory(data);

  const duplicateName = await query(
    `SELECT id FROM categories
     WHERE LOWER(TRIM(nama_kategori)) = LOWER($1)`,
    [nama]
  );

  if (duplicateName.length > 0) {
    throw new Error("Kategori tersebut sudah terdaftar.");
  }

  if (kode) {
    const duplicateCode = await query(
      `SELECT id FROM categories
       WHERE LOWER(TRIM(kode_klasifikasi)) = LOWER($1)`,
      [kode]
    );

    if (duplicateCode.length > 0) {
      throw new Error("Kode klasifikasi tersebut sudah digunakan.");
    }
  }

  try {
    const result = await query(
      `INSERT INTO categories (
        nama_kategori,
        kode_klasifikasi,
        deskripsi
      )
      VALUES ($1, $2, $3)
      RETURNING *`,
      [nama, kode, deskripsi]
    );

    return {
      success: true,
      data: result[0],
    };
  } catch (error) {
    if (error.code === "23505") {
      throw new Error(
        "Nama kategori atau kode klasifikasi sudah digunakan."
      );
    }

    throw new Error("Gagal menambahkan kategori.");
  }
}

// UPDATE CATEGORY
export async function updateCategory(id, data) {
  await requireAdmin();

  const categoryId = Number(id);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error("ID kategori tidak valid.");
  }

  const { nama, kode, deskripsi } = validateCategory(data);

  const existing = await query(
    `SELECT id FROM categories
     WHERE id = $1`,
    [categoryId]
  );

  if (existing.length === 0) {
    throw new Error("Kategori tidak ditemukan.");
  }

  const duplicateName = await query(
    `SELECT id FROM categories
     WHERE LOWER(TRIM(nama_kategori)) = LOWER($1)
       AND id <> $2`,
    [nama, categoryId]
  );

  if (duplicateName.length > 0) {
    throw new Error("Nama kategori sudah digunakan.");
  }

  if (kode) {
    const duplicateCode = await query(
      `SELECT id FROM categories
       WHERE LOWER(TRIM(kode_klasifikasi)) = LOWER($1)
         AND id <> $2`,
      [kode, categoryId]
    );

    if (duplicateCode.length > 0) {
      throw new Error("Kode klasifikasi sudah digunakan.");
    }
  }

  try {
    const result = await query(
      `UPDATE categories
       SET
         nama_kategori = $1,
         kode_klasifikasi = $2,
         deskripsi = $3
       WHERE id = $4
       RETURNING *`,
      [nama, kode, deskripsi, categoryId]
    );

    return {
      success: true,
      data: result[0],
    };
  } catch (error) {
    if (error.code === "23505") {
      throw new Error(
        "Nama kategori atau kode klasifikasi sudah digunakan."
      );
    }

    throw new Error("Gagal memperbarui kategori.");
  }
}

// DELETE CATEGORY
export async function deleteCategory(id) {
  await requireAdmin();

  const categoryId = Number(id);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error("ID kategori tidak valid.");
  }

  const existing = await query(
    `SELECT id FROM categories
     WHERE id = $1`,
    [categoryId]
  );

  if (existing.length === 0) {
    throw new Error("Kategori tidak ditemukan.");
  }

  const linkedBooks = await query(
    `SELECT COUNT(*)::int AS total
     FROM book_categories
     WHERE category_id = $1`,
    [categoryId]
  );

  if (linkedBooks[0].total > 0) {
    throw new Error(
      "Kategori tidak dapat dihapus karena masih digunakan oleh buku."
    );
  }

  await query(
    `DELETE FROM categories
     WHERE id = $1`,
    [categoryId]
  );

  return {
    success: true,
  };
}