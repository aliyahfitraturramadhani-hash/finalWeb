"use server";

import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

const VALID_CATEGORIES = ["Operational", "Service", "Event"];
const VALID_STATUSES = ["draft", "published", "archived"];

// GET ANNOUNCEMENTS
export async function getAnnouncements(keyword = "", categoryFilter = "") {
  await getActiveUser(["admin", "librarian"]);

  const params = [];
  const conditions = [];

  if (categoryFilter && categoryFilter !== "semua") {
    params.push(categoryFilter);
    conditions.push(`kategori = $${params.length}`);
  }

  const search = keyword.trim();

  if (search) {
    params.push(`%${search}%`);
    const searchParam = `$${params.length}`;

    conditions.push(
      `(judul ILIKE ${searchParam} OR isi ILIKE ${searchParam})`
    );
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await query(
    `SELECT id, judul, isi, kategori, status, tanggal_rilis,
            published_at, created_at, updated_at
     FROM announcements
     ${whereClause}
     ORDER BY tanggal_rilis DESC NULLS LAST, created_at DESC`,
    params
  );

  return result;
}

// CREATE ANNOUNCEMENT
export async function createAnnouncement(data) {
  const user = await getActiveUser(["admin", "librarian"]);

  const judul = data.judul?.trim();
  const isi = data.isi?.trim();
  const kategori = data.kategori;
  const tanggalRilis = data.tanggal_rilis;
  const status = data.status;

  if (!judul || !isi || !kategori || !tanggalRilis || !status) {
    throw new Error("Semua field wajib diisi.");
  }

  if (judul.length > 200) {
    throw new Error("Judul maksimal 200 karakter.");
  }

  if (!VALID_CATEGORIES.includes(kategori)) {
    throw new Error("Kategori pengumuman tidak valid.");
  }

  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Status publikasi tidak valid.");
  }

  const result = await query(
    `INSERT INTO announcements
      (judul, isi, kategori, tanggal_rilis, status, created_by, published_at)
     VALUES
      ($1, $2, $3, $4, $5::TEXT, $6,
       CASE
         WHEN $5::TEXT = 'published'
         THEN CURRENT_TIMESTAMP
         ELSE NULL
       END)
     RETURNING *`,
    [judul, isi, kategori, tanggalRilis, status, user.id]
  );

  return result;
}


// UPDATE ANNOUNCEMENT
export async function updateAnnouncement(id, data) {
  await getActiveUser(["admin", "librarian"]);

  const judul = data.judul?.trim();
  const isi = data.isi?.trim();
  const kategori = data.kategori;
  const tanggalRilis = data.tanggal_rilis;
  const status = data.status;

  if (!judul || !isi || !kategori || !tanggalRilis || !status) {
    throw new Error("Semua field wajib diisi.");
  }

  if (judul.length > 200) {
    throw new Error("Judul maksimal 200 karakter.");
  }

  if (!VALID_CATEGORIES.includes(kategori)) {
    throw new Error("Kategori pengumuman tidak valid.");
  }

  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Status publikasi tidak valid.");
  }

  const result = await query(
    `UPDATE announcements
     SET judul = $2,
         isi = $3,
         kategori = $4,
         tanggal_rilis = $5,
         status = $6::TEXT,
         published_at = CASE
           WHEN $6::TEXT = 'published'
             THEN COALESCE(published_at, CURRENT_TIMESTAMP)
           ELSE NULL
         END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id, judul, isi, kategori, tanggalRilis, status]
  );

  if (!result || result.length === 0) {
    throw new Error("Pengumuman tidak ditemukan.");
  }

  return result;
}

// TOGGLE STATUS
export async function toggleAnnouncementStatus(id) {
  await getActiveUser(["admin", "librarian"]);

  const result = await query(
    `UPDATE announcements
     SET status = CASE
           WHEN status = 'published' THEN 'draft'
           ELSE 'published'
         END,
         published_at = CASE
           WHEN status = 'published' THEN NULL
           ELSE CURRENT_TIMESTAMP
         END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
       AND status IN ('draft', 'published')
     RETURNING *`,
    [id]
  );

  if (!result || result.length === 0) {
    throw new Error("Pengumuman tidak ditemukan atau tidak dapat diubah.");
  }

  return result;
}

// DELETE ANNOUNCEMENT
export async function deleteAnnouncement(id) {
  await getActiveUser(["admin", "librarian"]);

  const result = await query(
    `DELETE FROM announcements
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  if (!result || result.length === 0) {
    throw new Error("Pengumuman tidak ditemukan.");
  }

  return { success: true };
}

// RESTORE ARCHIVED ANNOUNCEMENT TO DRAFT
export async function restoreAnnouncement(id) {
  await getActiveUser(["admin", "librarian"]);

  const result = await query(
    `UPDATE announcements
     SET status = 'draft',
         published_at = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
       AND status = 'archived'
     RETURNING *`,
    [id]
  );

  if (!result || result.length === 0) {
    throw new Error("Pengumuman tidak ditemukan atau bukan arsip.");
  }

  return result;
}