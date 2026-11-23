import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

// =========================================
// MENGAMBIL DATA PEMINJAMAN MAHASISWA
// =========================================

export async function getPeminjamanMahasiswa() {
  const user = await getActiveUser("member");

  // Mencari data member berdasarkan user yang sedang login
  const members = await query(
    `SELECT id
     FROM members
     WHERE user_id = $1`,
    [user.id]
  );

  const member = members[0];

  // Jika user belum memiliki data member
  if (!member) {
    return [];
  }

  // =========================================
  // MENGAMBIL DATA PEMINJAMAN + BUKU
  // + STATUS PENGAJUAN PERPANJANGAN
  // =========================================

  const rows = await query(
    `SELECT
        l.id AS loan_id,
        l.kode_pinjam,
        l.status AS status_peminjaman,
        l.batas_ambil,
        l.tanggal_pinjam,
        l.jatuh_tempo,
        l.jumlah_perpanjangan,
        l.alasan_penolakan,

        EXISTS (
          SELECT 1
          FROM extension_requests er
          WHERE er.loan_id = l.id
            AND er.status = 'pending'
        ) AS pengajuan_perpanjangan_pending,

        li.id AS loan_item_id,
        li.tanggal_kembali,
        li.kondisi_kembali,

        bc.id AS copy_id,
        bc.kode_eksemplar,
        bc.status AS status_eksemplar,

        b.id AS book_id,
        b.judul,
        b.penulis,
        b.penerbit,
        b.tahun_terbit,
        b.sampul,
        b.lokasi_rak

     FROM loans l

     LEFT JOIN loan_items li
       ON li.loan_id = l.id

     LEFT JOIN book_copies bc
       ON bc.id = li.copy_id

     LEFT JOIN books b
       ON b.id = bc.book_id

     WHERE l.member_id = $1

     ORDER BY l.created_at DESC, li.id ASC`,
    [member.id]
  );

  // =========================================
  // MENGELOMPOKKAN BUKU BERDASARKAN TRANSAKSI
  // =========================================

  const peminjamanMap = new Map();

  for (const row of rows) {
    if (!peminjamanMap.has(row.loan_id)) {
      peminjamanMap.set(row.loan_id, {
        id: row.loan_id,
        kode_pinjam: row.kode_pinjam,
        status: row.status_peminjaman,
        batas_ambil: row.batas_ambil,
        tanggal_pinjam: row.tanggal_pinjam,
        jatuh_tempo: row.jatuh_tempo,
        jumlah_perpanjangan: row.jumlah_perpanjangan,
        alasan_penolakan: row.alasan_penolakan,

        // Status pengajuan perpanjangan
        pengajuan_perpanjangan_pending:
          row.pengajuan_perpanjangan_pending,

        buku: [],
      });
    }

    // =========================================
    // MENAMBAHKAN DATA BUKU
    // =========================================

    if (row.loan_item_id) {
      peminjamanMap.get(row.loan_id).buku.push({
        loan_item_id: row.loan_item_id,
        tanggal_kembali: row.tanggal_kembali,
        kondisi_kembali: row.kondisi_kembali,

        copy_id: row.copy_id,
        kode_eksemplar: row.kode_eksemplar,
        status_eksemplar: row.status_eksemplar,

        book_id: row.book_id,
        judul: row.judul,
        penulis: row.penulis,
        penerbit: row.penerbit,
        tahun_terbit: row.tahun_terbit,
        sampul: row.sampul,
        lokasi_rak: row.lokasi_rak,
      });
    }
  }

  return Array.from(peminjamanMap.values());
}