"use server";

import { getActiveUser } from "@/lib/auth";
import { withTransaction } from "@/lib/db";

export async function prosesPengajuanPerpanjangan(
  requestId,
  keputusan,
  catatan = ""
) {
  try {
    const user = await getActiveUser("librarian");

    if (!user) {
      return {
        success: false,
        message: "Sesi petugas tidak ditemukan.",
      };
    }

    if (!Number.isInteger(Number(requestId)) || Number(requestId) <= 0) {
      return {
        success: false,
        message: "ID pengajuan tidak valid.",
      };
    }

    if (!["approved", "rejected"].includes(keputusan)) {
      return {
        success: false,
        message: "Keputusan tidak valid.",
      };
    }

    if (typeof catatan !== "string" || catatan.length > 500) {
      return {
        success: false,
        message: "Catatan maksimal 500 karakter.",
      };
    }

    if (keputusan === "rejected" && catatan.trim().length < 5) {
      return {
        success: false,
        message: "Catatan penolakan minimal 5 karakter.",
      };
    }

    const result = await withTransaction(async (client) => {
      // Ambil dan kunci pengajuan
      const requestResult = await client.query(
        `
          SELECT
            id,
            loan_id,
            member_id,
            status,
            tanggal_jatuh_tempo_lama,
            tanggal_jatuh_tempo_baru
          FROM extension_requests
          WHERE id = $1
          FOR UPDATE
        `,
        [Number(requestId)]
      );

      if (requestResult.rows.length === 0) {
        throw new Error("Pengajuan tidak ditemukan.");
      }

      const request = requestResult.rows[0];

      if (request.status !== "pending") {
        throw new Error("Pengajuan ini sudah diproses.");
      }

      // Kunci transaksi peminjaman
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
          FOR UPDATE
        `,
        [request.loan_id]
      );

      if (loanResult.rows.length === 0) {
        throw new Error("Data peminjaman tidak ditemukan.");
      }

      const loan = loanResult.rows[0];

      if (loan.member_id !== request.member_id) {
        throw new Error("Data anggota tidak sesuai.");
      }

      if (loan.status !== "sedang_dipinjam") {
        throw new Error("Peminjaman tidak lagi aktif.");
      }

      if (keputusan === "approved") {
        if (Number(loan.jumlah_perpanjangan) >= 1) {
          throw new Error("Peminjaman sudah mencapai batas perpanjangan.");
        }

        // Pastikan tanggal yang diajukan masih sesuai
        if (
          String(loan.jatuh_tempo).slice(0, 10) !==
          String(request.tanggal_jatuh_tempo_lama).slice(0, 10)
        ) {
          throw new Error(
            "Tanggal jatuh tempo telah berubah. Pengajuan tidak dapat diproses."
          );
        }

        // Perbarui jatuh tempo peminjaman
        await client.query(
          `
            UPDATE loans
            SET
              jatuh_tempo = $1,
              jumlah_perpanjangan = jumlah_perpanjangan + 1,
              updated_at = NOW()
            WHERE id = $2
          `,
          [request.tanggal_jatuh_tempo_baru, request.loan_id]
        );
      }

      // Perbarui status pengajuan
      await client.query(
        `
          UPDATE extension_requests
          SET
            status = $1,
            processed_by = $2,
            catatan_petugas = $3,
            processed_at = NOW()
          WHERE id = $4
        `,
        [
          keputusan,
          user.id,
          catatan.trim() || null,
          Number(requestId),
        ]
      );

      return true;
    });

    return {
      success: true,
      message:
        keputusan === "approved"
          ? "Pengajuan berhasil disetujui."
          : "Pengajuan berhasil ditolak.",
    };
  } catch (error) {
    console.error("Proses pengajuan perpanjangan:", error);

    return {
      success: false,
      message:
        error.message || "Terjadi kesalahan saat memproses pengajuan.",
    };
  }
}