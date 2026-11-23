"use server";

import { getActiveUser } from "@/lib/auth";
import { withTransaction } from "@/lib/db";

export async function submitExtensionRequest(loanId, alasan) {
  try {
    // =========================================
    // 1. VALIDASI SESSION
    // =========================================

    const user = await getActiveUser("member");

    if (!user) {
      return {
        success: false,
        message: "Sesi pengguna tidak ditemukan.",
      };
    }

    // =========================================
    // 2. VALIDASI INPUT
    // =========================================

    if (!loanId || !Number.isInteger(Number(loanId))) {
      return {
        success: false,
        message: "ID peminjaman tidak valid.",
      };
    }

    if (
      typeof alasan !== "string" ||
      alasan.trim().length < 10 ||
      alasan.trim().length > 500
    ) {
      return {
        success: false,
        message: "Alasan harus terdiri dari 10–500 karakter.",
      };
    }

    // =========================================
    // 3. TRANSACTION
    // =========================================

    const result = await withTransaction(async (client) => {

      // Cari member berdasarkan user yang login
      const memberResult = await client.query(
        `
        SELECT id
        FROM members
        WHERE user_id = $1
        `,
        [user.id]
      );

      if (memberResult.rows.length === 0) {
        throw new Error("Data anggota tidak ditemukan.");
      }

      const memberId = memberResult.rows[0].id;

      // =========================================
      // 4. LOCK DAN VALIDASI PEMINJAMAN
      // =========================================

      const loanResult = await client.query(
        `
        SELECT
          id,
          member_id,
          status,
          jatuh_tempo,
          jumlah_perpanjangan
        FROM loans
        WHERE id = $1
          AND member_id = $2
        FOR UPDATE
        `,
        [Number(loanId), memberId]
      );

      if (loanResult.rows.length === 0) {
        throw new Error("Data peminjaman tidak ditemukan.");
      }

      const loan = loanResult.rows[0];

      // =========================================
      // 5. VALIDASI STATUS
      // =========================================

      if (loan.status !== "sedang_dipinjam") {
        throw new Error(
          "Perpanjangan hanya dapat diajukan untuk peminjaman yang sedang berlangsung."
        );
      }

      // =========================================
      // 6. VALIDASI BATAS PERPANJANGAN
      // =========================================

      if (loan.jumlah_perpanjangan >= 1) {
        throw new Error(
          "Peminjaman ini sudah mencapai batas perpanjangan."
        );
      }

      if (!loan.jatuh_tempo) {
        throw new Error(
          "Tanggal jatuh tempo peminjaman tidak ditemukan."
        );
      }

      // =========================================
      // 7. CEK PENGAJUAN PENDING
      // =========================================

      const pendingResult = await client.query(
        `
        SELECT id
        FROM extension_requests
        WHERE loan_id = $1
          AND status = 'pending'
        LIMIT 1
        `,
        [loan.id]
      );

      if (pendingResult.rows.length > 0) {
        throw new Error(
          "Masih terdapat pengajuan perpanjangan yang menunggu keputusan petugas."
        );
      }

      // =========================================
      // 8. HITUNG TANGGAL BARU (+7 HARI)
      // =========================================

      const tanggalLama = loan.jatuh_tempo;

      const tanggalBaruResult = await client.query(
        `
        SELECT ($1::date + INTERVAL '7 days')::date AS tanggal_baru
        `,
        [tanggalLama]
      );

      const tanggalBaru =
        tanggalBaruResult.rows[0].tanggal_baru;

      // =========================================
      // 9. SIMPAN PENGAJUAN
      // =========================================

      const insertResult = await client.query(
        `
        INSERT INTO extension_requests (
          loan_id,
          member_id,
          alasan,
          tanggal_jatuh_tempo_lama,
          tanggal_jatuh_tempo_baru,
          status
        )
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING id
        `,
        [
          loan.id,
          memberId,
          alasan.trim(),
          tanggalLama,
          tanggalBaru,
        ]
      );

      return {
        requestId: insertResult.rows[0].id,
      };

    });

    // =========================================
    // 10. RESPONSE
    // =========================================

    return {
      success: true,
      message: "Pengajuan perpanjangan berhasil dikirim.",
      requestId: result.requestId,
    };

  } catch (error) {

    console.error(
      "Extension request error:",
      error
    );

    return {
      success: false,
      message:
        error.message ||
        "Terjadi kesalahan saat mengirim pengajuan.",
    };
  }
}