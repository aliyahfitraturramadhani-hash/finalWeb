import Link from "next/link";
import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";

function formatTanggal(tanggal) {
  if (!tanggal) return "-";

  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
}

function formatRupiah(value) {
  return Number(value || 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
}

function getStatusLabel(status) {
  const labels = {
    sedang_dipinjam: "Sedang Dipinjam",
    menunggu_konfirmasi: "Menunggu Konfirmasi",
    menunggu_pengambilan: "Menunggu Pengambilan",
    perpanjangan_diajukan: "Perpanjangan Diajukan",
    selesai: "Selesai",
    ditolak: "Ditolak",
  };

  return labels[status] || status;
}

function getStatusStyle(status) {
  const styles = {
    sedang_dipinjam: "bg-blue-500/20 text-blue-400",
    menunggu_konfirmasi: "bg-amber-500/20 text-amber-400",
    menunggu_pengambilan: "bg-amber-500/20 text-amber-400",
    perpanjangan_diajukan: "bg-purple-500/20 text-purple-400",
    selesai: "bg-teal-500/20 text-teal-400",
    ditolak: "bg-rose-500/20 text-rose-400",
  };

  return styles[status] || "bg-gray-500/20 text-gray-400";
}

function getDeadlineInfo(tanggal) {
  if (!tanggal) {
    return "-";
  }

  // Gunakan tanggal lokal Asia/Makassar untuk perbandingan tanggal
  const todayString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
  }).format(new Date());

  const dueString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
  }).format(new Date(tanggal));

  const today = new Date(`${todayString}T00:00:00`);
  const dueDate = new Date(`${dueString}T00:00:00`);

  const diff = Math.round(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff < 0) {
    return {
      text: `Terlambat ${Math.abs(diff)} hari`,
      style: "text-rose-400 font-semibold",
    };
  }

  if (diff === 0) {
    return {
      text: "Jatuh tempo hari ini",
      style: "text-amber-400 font-semibold",
    };
  }

  if (diff <= 2) {
    return {
      text: `H-${diff}`,
      style: "text-amber-400 font-semibold",
    };
  }

  return {
    text: `H-${diff}`,
    style: "text-[#A6A1BC]",
  };
}

function StatCard({ title, value, color, icon }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#211D39] px-5 py-4">

      <div className="flex items-center justify-between">

        <p className="text-sm text-[#A6A1BC]">
          {title}
        </p>

        <span className={`text-xl ${color}`}>
          {icon}
        </span>

      </div>

      <h3 className={`mt-2 text-2xl font-bold ${color}`}>
        {value}
      </h3>

    </div>
  );
}

export default async function MahasiswaPage() {
  const user = await getActiveUser("member");

  // =========================================
  // PEMINJAMAN AKTIF
  // =========================================

  const peminjamanAktif = await query(
    `
      SELECT
        l.id AS loan_id,
        l.kode_pinjam,
        l.status,
        l.jatuh_tempo,
        l.jumlah_perpanjangan,

        li.id AS loan_item_id,

        b.judul,
        b.sampul

      FROM members m
      JOIN loans l ON l.member_id = m.id
      JOIN loan_items li ON li.loan_id = l.id
      JOIN book_copies bc ON bc.id = li.copy_id
      JOIN books b ON b.id = bc.book_id

      WHERE m.user_id = $1
        AND li.tanggal_kembali IS NULL
        AND l.status IN (
          'sedang_dipinjam',
          'menunggu_pengambilan',
          'perpanjangan_diajukan'
        )

      ORDER BY l.jatuh_tempo ASC NULLS LAST
    `,
    [user.id]
  );

  // =========================================
  // RIWAYAT TRANSAKSI
  // =========================================

  const riwayat = await query(
    `
      SELECT
        l.kode_pinjam,
        l.status,
        l.created_at,

        li.id AS loan_item_id,
        li.tanggal_kembali,

        b.id AS book_id,
        b.judul,

        r.rating

      FROM members m
      JOIN loans l ON l.member_id = m.id
      JOIN loan_items li ON li.loan_id = l.id
      JOIN book_copies bc ON bc.id = li.copy_id
      JOIN books b ON b.id = bc.book_id

      LEFT JOIN reviews r
        ON r.loan_item_id = li.id

      WHERE m.user_id = $1
        AND (
          li.tanggal_kembali IS NOT NULL
          OR l.status = 'ditolak'
        )

      ORDER BY l.created_at DESC
      LIMIT 5
    `,
    [user.id]
  );

  // =========================================
  // DENDA TERTUNGGAK
  // =========================================

  const dataDenda = await query(
    `
      SELECT
        COUNT(*) AS jumlah_denda,
        COALESCE(SUM(jumlah_denda), 0) AS total_denda

      FROM fines f

      JOIN loan_items li
        ON li.id = f.loan_item_id

      JOIN loans l
        ON l.id = li.loan_id

      JOIN members m
        ON m.id = l.member_id

      WHERE m.user_id = $1
        AND f.status = 'belum_dibayar'
    `,
    [user.id]
  );

  // =========================================
  // RIWAYAT SELESAI
  // =========================================

  const dataSelesai = await query(
    `
      SELECT COUNT(*) AS total

      FROM members m
      JOIN loans l ON l.member_id = m.id
      JOIN loan_items li ON li.loan_id = l.id

      WHERE m.user_id = $1
        AND li.tanggal_kembali IS NOT NULL
    `,
    [user.id]
  );

  const jumlahAktif = peminjamanAktif.length;
  const jumlahSelesai = Number(dataSelesai[0]?.total || 0);
  const jumlahDenda = Number(dataDenda[0]?.jumlah_denda || 0);
  const totalDenda = Number(dataDenda[0]?.total_denda || 0);

  const bukuTerlambat = peminjamanAktif.filter((item) => {
    if (!item.jatuh_tempo) return false;

    const info = getDeadlineInfo(item.jatuh_tempo);

    return info.text.startsWith("Terlambat");
  }).length;

  return (
    <div className="min-h-screen space-y-7 bg-[#151229] p-5 text-[#F5F0E8] md:p-7">

      {/* GREETING */}
      <section>

        <h1 className="text-2xl font-bold">
          Halo, {user.nama}
        </h1>

        <p className="mt-1 text-sm text-[#A6A1BC]">
          Dashboard Mahasiswa
        </p>

      </section>

      {/* BANNER DENDA */}
      {jumlahDenda > 0 && (

        <section className="rounded-2xl border-2 border-[#FF6387] bg-[#351D36] p-5">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FF6387]/20 text-2xl text-[#FF6387]">
                !
              </div>

              <div>

                <h2 className="text-lg font-bold text-[#FF6387]">
                  Denda tertunggak: {formatRupiah(totalDenda)}
                </h2>

                <p className="mt-1 text-sm text-[#E5C9D4]">
                  Pengajuan pinjam baru dapat diblokir sampai denda diselesaikan.
                </p>

                <p className="mt-1 text-xs text-[#A6A1BC]">
                  {bukuTerlambat} buku terlambat | Status: Denda tertunggak
                </p>

              </div>

            </div>

            <Link
              href="/mahasiswa/riwayat"
              className="rounded-full bg-[#FF6387] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#ff7797]"
            >
              Lihat rincian
            </Link>

          </div>

        </section>

      )}

      {/* STATISTIK */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <StatCard
          title="Peminjaman aktif"
          value={jumlahAktif}
          color="text-[#4DA3FF]"
          icon="▤"
        />

        <StatCard
          title="Riwayat selesai"
          value={jumlahSelesai}
          color="text-[#20B8A5]"
          icon="✓"
        />

        <StatCard
          title="Denda tertunggak"
          value={formatRupiah(totalDenda)}
          color="text-[#FF6387]"
          icon="!"
        />

      </section>

      {/* =========================================
          PEMINJAMAN AKTIF
      ========================================= */}

      <section>

        <h2 className="mb-1 text-lg font-bold">
          Peminjaman aktif
        </h2>

        <p className="mb-4 text-sm text-[#A6A1BC]">
          Buku yang sedang kamu pinjam atau dalam proses pengambilan.
        </p>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px] text-left">

            <thead>

              <tr className="border-b border-white/10 text-xs uppercase text-[#A6A1BC]">

                <th className="px-3 py-3">
                  Buku
                </th>

                <th className="px-3 py-3">
                  Jatuh Tempo
                </th>

                <th className="px-3 py-3">
                  Status
                </th>

                <th className="px-3 py-3">
                  Info
                </th>

                <th className="px-3 py-3">
                  Aksi
                </th>

              </tr>

            </thead>

            <tbody>

              {peminjamanAktif.length === 0 ? (

                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-sm text-[#A6A1BC]"
                  >
                    Belum ada peminjaman aktif.
                  </td>
                </tr>

              ) : (

                peminjamanAktif.map((item) => {

                  const deadline = getDeadlineInfo(item.jatuh_tempo);

                  return (

                    <tr
                      key={item.loan_item_id}
                      className="border-b border-white/5 bg-[#211D39]/60 transition hover:bg-[#211D39]"
                    >

                      {/* BUKU */}
                      <td className="px-3 py-4">

                        <p className="max-w-[250px] font-medium">
                          {item.judul}
                        </p>

                        <p className="mt-1 text-xs text-[#827A9B]">
                          {item.kode_pinjam}
                        </p>

                      </td>

                      {/* DEADLINE */}
                      <td className="px-3 py-4 text-sm text-[#D6D1E5]">
                        {formatTanggal(item.jatuh_tempo)}
                      </td>

                      {/* STATUS */}
                      <td className="px-3 py-4">

                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(item.status)}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>

                      </td>

                      {/* INFO */}
                      <td className="px-3 py-4 text-sm">

                        {item.jatuh_tempo &&
                        item.status === "sedang_dipinjam" ? (

                          <span className={deadline.style}>
                            {deadline.text}
                          </span>

                        ) : (

                          <span className="text-[#827A9B]">
                            -
                          </span>

                        )}

                      </td>

                      {/* AKSI */}
                      <td className="px-3 py-4">

                        {item.status === "sedang_dipinjam" ? (

                          <Link
                            href="/mahasiswa/peminjaman"
                            className="inline-block rounded-full border border-[#FFB82E] px-4 py-2 text-xs font-semibold text-[#FFB82E] transition hover:bg-[#FFB82E] hover:text-[#151229]"
                          >
                            Ajukan Perpanjangan
                          </Link>

                        ) : item.status === "perpanjangan_diajukan" ? (

                          <span className="rounded-full border border-purple-400/50 px-4 py-2 text-xs text-purple-400">
                            Menunggu Pegawai
                          </span>

                        ) : (

                          <span className="text-xs text-[#827A9B]">
                            -
                          </span>

                        )}

                      </td>

                    </tr>

                  );

                })

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* =========================================
          RIWAYAT TRANSAKSI
      ========================================= */}

      <section>

        <div className="mb-4">

          <h2 className="text-lg font-bold">
            Riwayat transaksi
          </h2>

          <p className="mt-1 text-sm text-[#A6A1BC]">
            Transaksi peminjaman sebelumnya.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px] text-left">

            <thead>

              <tr className="border-b border-white/10 text-xs uppercase text-[#A6A1BC]">

                <th className="px-3 py-3">
                  Buku
                </th>

                <th className="px-3 py-3">
                  Dipinjam
                </th>

                <th className="px-3 py-3">
                  Status
                </th>

                <th className="px-3 py-3">
                  Dikembalikan
                </th>

                <th className="px-3 py-3">
                  Ulasan
                </th>

              </tr>

            </thead>

            <tbody>

              {riwayat.length === 0 ? (

                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-sm text-[#A6A1BC]"
                  >
                    Belum ada riwayat transaksi.
                  </td>
                </tr>

              ) : (

                riwayat.map((item, index) => (

                  <tr
                    key={`${item.loan_item_id}-${index}`}
                    className="border-b border-white/5 bg-[#211D39]/60 transition hover:bg-[#211D39]"
                  >

                    {/* BUKU */}
                    <td className="px-3 py-4">

                      <p className="max-w-[250px] font-medium">
                        {item.judul}
                      </p>

                      <p className="mt-1 text-xs text-[#827A9B]">
                        {item.kode_pinjam}
                      </p>

                    </td>

                    {/* DIPINJAM */}
                    <td className="px-3 py-4 text-sm text-[#D6D1E5]">
                      {formatTanggal(item.created_at)}
                    </td>

                    {/* STATUS */}
                    <td className="px-3 py-4">

                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(item.status)}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>

                    </td>

                    {/* RETURN */}
                    <td className="px-3 py-4 text-sm text-[#D6D1E5]">
                      {formatTanggal(item.tanggal_kembali)}
                    </td>

                    {/* REVIEW */}
                    <td className="px-3 py-4">

                      {item.status === "selesai" && item.rating ? (

                        <span className="text-amber-400">
                          {"★".repeat(Number(item.rating))}
                        </span>

                      ) : item.status === "selesai" ? (

                        <Link
                          href="/mahasiswa/riwayat"
                          className="text-sm font-semibold text-[#FFB82E] hover:underline"
                        >
                          Tulis ulasan
                        </Link>

                      ) : (

                        <span className="text-[#827A9B]">
                          -
                        </span>

                      )}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* =========================================
          NOTIFIKASI
      ========================================= */}

      <section>

        <h2 className="mb-4 text-lg font-bold">
          Notifikasi terbaru
        </h2>

        <div className="space-y-3">

          <div className="flex items-start gap-3">

            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#FFB82E]" />

            <p className="text-sm text-[#D6D1E5]">
              Pantau tanggal jatuh tempo buku melalui bagian peminjaman aktif.
            </p>

          </div>

          {bukuTerlambat > 0 && (

            <div className="flex items-start gap-3">

              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF6387]" />

              <p className="text-sm text-[#D6D1E5]">
                Kamu memiliki {bukuTerlambat} buku yang melewati tanggal jatuh tempo.
              </p>

            </div>

          )}

          {jumlahDenda > 0 && (

            <div className="flex items-start gap-3">

              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF6387]" />

              <p className="text-sm text-[#D6D1E5]">
                Denda baru atau denda tertunggak tercatat pada akunmu.
              </p>

            </div>

          )}

          <div className="flex items-start gap-3">

            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#20B8A5]" />

            <p className="text-sm text-[#D6D1E5]">
              Informasi pengajuan dan peminjaman tersedia pada menu Peminjaman Saya.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}