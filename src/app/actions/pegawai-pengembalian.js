"use server";

import { withTransaction } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";
import { allocateAvailableCopiesToReservations } from "@/lib/reservasi/allocate";
import { revalidatePath } from "next/cache";

export async function processReturn(loanItemId, kondisiKembali) {
  const user = await getActiveUser([
  "admin",
  "librarian",
]);
  const validConditions = ["baik", "rusak", "hilang"];
  if (!validConditions.includes(kondisiKembali)) throw new Error("Kondisi pengembalian tidak valid.");

  const result = await withTransaction(async (client) => {
    const itemResult = await client.query(`
      SELECT li.id, li.loan_id, li.copy_id, li.tanggal_kembali,
        l.status AS loan_status, l.jatuh_tempo,
        bc.status AS copy_status, bc.book_id,
        b.harga_pengganti, b.tarif_denda_harian
      FROM loan_items li
      JOIN loans l ON l.id = li.loan_id
      JOIN book_copies bc ON bc.id = li.copy_id
      JOIN books b ON b.id = bc.book_id
      WHERE li.id = $1
      FOR UPDATE OF li, bc, l
    `, [loanItemId]);
    if (!itemResult.rowCount) throw new Error("Data peminjaman tidak ditemukan.");
    const item = itemResult.rows[0];
    if (item.loan_status !== "sedang_dipinjam") throw new Error("Transaksi bukan peminjaman aktif.");
    if (item.tanggal_kembali) throw new Error("Buku ini sudah dikembalikan.");

    await client.query(`UPDATE loan_items SET tanggal_kembali = CURRENT_TIMESTAMP, kondisi_kembali = $2 WHERE id = $1`, [loanItemId, kondisiKembali]);

    const copyStatus = kondisiKembali === "rusak" ? "dalam_perbaikan" : kondisiKembali === "hilang" ? "hilang" : "tersedia";
    await client.query(`
      UPDATE book_copies
      SET status = $2::text,
        kondisi = CASE WHEN $2::text = 'dalam_perbaikan' THEN 'rusak_ringan'
          WHEN $2::text = 'hilang' THEN 'rusak_berat' ELSE 'baik' END,
        updated_at = NOW()
      WHERE id = $1
    `, [item.copy_id, copyStatus]);

    const lateResult = await client.query(`SELECT GREATEST(CURRENT_DATE - $1::date, 0)::integer AS hari_terlambat`, [item.jatuh_tempo]);
    const lateDays = lateResult.rows[0].hari_terlambat;
    if (lateDays > 0) {
      const tariff = Number(item.tarif_denda_harian || 0);
      await client.query(`
        INSERT INTO fines (loan_item_id, jenis, hari_terlambat, tarif_per_hari, jumlah_denda, status, processed_by)
        VALUES ($1, 'terlambat', $2, $3, $4, 'belum_dibayar', $5)
        ON CONFLICT (loan_item_id, jenis) DO NOTHING
      `, [loanItemId, lateDays, tariff, lateDays * tariff, user.id]);
    }
    if (kondisiKembali === "rusak") {
      await client.query(`INSERT INTO fines (loan_item_id, jenis, hari_terlambat, jumlah_denda, status, processed_by) VALUES ($1, 'rusak', 0, 50000, 'belum_dibayar', $2) ON CONFLICT (loan_item_id, jenis) DO NOTHING`, [loanItemId, user.id]);
    }
    if (kondisiKembali === "hilang") {
      await client.query(`INSERT INTO fines (loan_item_id, jenis, hari_terlambat, jumlah_denda, status, processed_by) VALUES ($1, 'hilang', 0, $2, 'belum_dibayar', $3) ON CONFLICT (loan_item_id, jenis) DO NOTHING`, [loanItemId, Number(item.harga_pengganti || 0), user.id]);
    }

    const remaining = await client.query(`SELECT COUNT(*)::integer AS remaining FROM loan_items WHERE loan_id = $1 AND tanggal_kembali IS NULL`, [item.loan_id]);
    if (remaining.rows[0].remaining === 0) await client.query(`UPDATE loans SET status = 'selesai', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [item.loan_id]);

    // Buku baik: expire deadlines yang sudah lewat dan alokasikan eksemplar ke antrean.
    const reservationResult = copyStatus === "tersedia"
      ? await allocateAvailableCopiesToReservations(client, item.book_id, user.id)
      : { allocated: 0, expired: 0 };

    return { success: true, hari_terlambat: lateDays, status_eksemplar: copyStatus, reservationResult };
  });

  revalidatePath("/pegawai/pengembalian");
  revalidatePath("/pegawai/reservasi");
  revalidatePath("/admin/reservasi");
  revalidatePath("/mahasiswa/reservasi");
  revalidatePath("/mahasiswa/katalog");
  return result;
}
