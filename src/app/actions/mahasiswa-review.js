"use server";

import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";

// ==========================================
// MENAMBAHKAN REVIEW BUKU
// ==========================================

export async function submitReview(formData) {
  const user = await getActiveUser("member");

  const loanItemId = formData.get("loan_item_id");
  const rating = Number(formData.get("rating"));
  const komentar = formData.get("komentar")?.trim() || null;

  // VALIDASI INPUT
  if (
    !loanItemId ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return {
      success: false,
      message: "Rating harus antara 1 sampai 5.",
    };
  }

  // MEMASTIKAN PEMINJAMAN MILIK MEMBER DAN SUDAH DIKEMBALIKAN
  const eligible = await query(
    `
      SELECT
        li.id AS loan_item_id,
        b.id AS book_id,
        m.id AS member_id
      FROM loan_items li
      JOIN loans l
        ON l.id = li.loan_id
      JOIN members m
        ON m.id = l.member_id
      JOIN book_copies bc
        ON bc.id = li.copy_id
      JOIN books b
        ON b.id = bc.book_id
      WHERE li.id = $1
        AND m.user_id = $2
        AND li.tanggal_kembali IS NOT NULL
    `,
    [loanItemId, user.id]
  );

  if (eligible.length === 0) {
    return {
      success: false,
      message: "Buku belum dikembalikan atau data tidak valid.",
    };
  }

  const { loan_item_id, book_id, member_id } = eligible[0];

  // MENYIMPAN REVIEW
  try {
    await query(
      `
        INSERT INTO reviews (
          loan_item_id,
          book_id,
          member_id,
          rating,
          komentar
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [loan_item_id, book_id, member_id, rating, komentar]
    );

    return {
      success: true,
      message: "Review berhasil disimpan!",
    };
  } catch (error) {
    // REVIEW SUDAH PERNAH DIBUAT
    if (error.code === "23505") {
      return {
        success: false,
        message: "Kamu sudah memberikan review untuk peminjaman ini.",
      };
    }

    console.error("Submit review error:", error);

    return {
      success: false,
      message: "Terjadi kesalahan saat menyimpan review.",
    };
  }
}