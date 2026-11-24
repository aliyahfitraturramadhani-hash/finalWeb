import Link from "next/link";
import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";
import ReviewForm from "./ReviewForm";

function formatTanggal(tanggal) {
  if (!tanggal) return "-";

  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
}

function formatTanggalWaktu(tanggal) {
  if (!tanggal) return "-";

  return new Date(tanggal).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
    menunggu_konfirmasi: "Menunggu Konfirmasi",
    menunggu_pengambilan: "Menunggu Pengambilan",
    sedang_dipinjam: "Sedang Dipinjam",
    perpanjangan_diajukan: "Perpanjangan Diajukan",
    selesai: "Selesai",
    ditolak: "Ditolak",
    dibatalkan: "Dibatalkan",
  };

  return labels[status] || status || "-";
}

function getStatusStyle(status) {
  const styles = {
    menunggu_konfirmasi: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    menunggu_pengambilan: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    sedang_dipinjam: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    perpanjangan_diajukan: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    selesai: "bg-teal-500/15 text-teal-400 border-teal-500/20",
    ditolak: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    dibatalkan: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  };

  return styles[status] || "bg-gray-500/15 text-gray-400 border-gray-500/20";
}

function getFineStatusStyle(status) {
  const styles = {
    tertunggak: "bg-rose-500/15 text-rose-400",
    belum_dibayar: "bg-rose-500/15 text-rose-400",
    lunas: "bg-teal-500/15 text-teal-400",
    dihapuskan: "bg-gray-500/15 text-gray-400",
  };

  return styles[status] || "bg-gray-500/15 text-gray-400";
}

function getFineStatusLabel(status) {
  const labels = {
    tertunggak: "Tertunggak",
    belum_dibayar: "Belum Dibayar",
    lunas: "Lunas",
    dihapuskan: "Dihapuskan",
  };

  return labels[status] || status || "-";
}

function StatCard({ title, value, description, icon, color }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#211D39] p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm text-[#A6A1BC]">
          {title}
        </p>

        <span className={`text-xl ${color}`}>
          {icon}
        </span>

      </div>

      <h3 className={`mt-3 text-2xl font-bold ${color}`}>
        {value}
      </h3>

      <p className="mt-1 text-xs text-[#827A9B]">
        {description}
      </p>

    </div>
  );
}

export default async function RiwayatMahasiswaPage() {
  const user = await getActiveUser("member");

  // =========================================
  // RIWAYAT PEMINJAMAN
  // =========================================

  const riwayat = await query(
    `
      SELECT
        l.id AS loan_id,
        l.kode_pinjam,
        l.status AS loan_status,
        l.created_at AS tanggal_pengajuan,
        l.tanggal_pinjam,
        l.jatuh_tempo,
        l.alasan_penolakan,

        li.id AS loan_item_id,
        li.tanggal_kembali,
        li.kondisi_kembali,

        bc.kode_eksemplar,

        b.id AS book_id,
        b.judul,
        b.penulis,
        b.sampul,

        r.rating,
        r.komentar AS review_komentar,
        r.created_at AS review_created_at,

        f.id AS fine_id,
        f.jenis AS fine_jenis,
        f.hari_terlambat,
        f.tarif_per_hari,
        f.jumlah_denda,
        f.status AS fine_status,
        f.alasan_penghapusan,
        f.dibayar_at

      FROM members m

      JOIN loans l
        ON l.member_id = m.id

      JOIN loan_items li
        ON li.loan_id = l.id

      JOIN book_copies bc
        ON bc.id = li.copy_id

      JOIN books b
        ON b.id = bc.book_id

      LEFT JOIN reviews r
        ON r.loan_item_id = li.id

      LEFT JOIN fines f
        ON f.loan_item_id = li.id

      WHERE m.user_id = $1

      ORDER BY l.created_at DESC, li.id DESC
    `,
    [user.id]
  );

  // =========================================
  // STATISTIK
  // =========================================

  const totalTransaksi = riwayat.length;

  const totalSelesai = riwayat.filter(
    (item) => item.tanggal_kembali !== null
  ).length;

  const totalDitolak = riwayat.filter(
    (item) => item.loan_status === "ditolak"
  ).length;

  const totalDendaTertunggak = riwayat
    .filter(
      (item) =>
        item.fine_status === "tertunggak" ||
        item.fine_status === "belum_dibayar"
    )
    .reduce(
      (total, item) => total + Number(item.jumlah_denda || 0),
      0
    );

  const jumlahDendaTertunggak = riwayat.filter(
    (item) =>
      item.fine_status === "tertunggak" ||
      item.fine_status === "belum_dibayar"
  ).length;

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="min-h-screen space-y-7 bg-[#151229] p-5 text-[#F5F0E8] md:p-7">

      {/* HEADER */}

      <section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h1 className="text-2xl font-bold">
              Riwayat Peminjaman
            </h1>

            <p className="mt-2 text-sm text-[#A6A1BC]">
              Pantau seluruh aktivitas peminjaman, pengembalian, dan denda buku.
            </p>

          </div>

          <Link
            href="/mahasiswa"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#D6D1E5] transition hover:bg-white/5"
          >
            ← Dashboard
          </Link>

        </div>

      </section>

      {/* STATISTIK */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Transaksi"
          value={totalTransaksi}
          description="Seluruh item peminjaman"
          icon="▤"
          color="text-[#A78BFA]"
        />

        <StatCard
          title="Buku Dikembalikan"
          value={totalSelesai}
          description="Item yang telah dikembalikan"
          icon="✓"
          color="text-[#20B8A5]"
        />

        <StatCard
          title="Pengajuan Ditolak"
          value={totalDitolak}
          description="Pengajuan yang tidak disetujui"
          icon="×"
          color="text-[#FF6387]"
        />

        <StatCard
          title="Denda Tertunggak"
          value={formatRupiah(totalDendaTertunggak)}
          description={`${jumlahDendaTertunggak} record denda`}
          icon="!"
          color="text-[#FF6387]"
        />

      </section>

      {/* INFORMASI */}

      <section className="rounded-2xl border border-[#A78BFA]/20 bg-[#211D39] p-5">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
            i
          </div>

          <div>

            <h2 className="font-semibold text-purple-300">
              Informasi Riwayat
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-[#A6A1BC]">
              Halaman ini menampilkan seluruh item peminjaman yang tercatat
              pada akunmu. Informasi pengembalian dan denda akan ditampilkan
              apabila tersedia pada transaksi tersebut.
            </p>

          </div>

        </div>

      </section>

      {/* RIWAYAT */}

      <section>

        <div className="mb-5">

          <h2 className="text-lg font-bold">
            Daftar Transaksi
          </h2>

          <p className="mt-1 text-sm text-[#A6A1BC]">
            Seluruh buku yang tercatat dalam aktivitas peminjamanmu.
          </p>

        </div>

        {riwayat.length === 0 ? (

          <div className="rounded-2xl border border-white/5 bg-[#211D39] px-6 py-16 text-center">

            <div className="text-5xl">
              📚
            </div>

            <h3 className="mt-4 font-semibold">
              Belum ada riwayat peminjaman
            </h3>

            <p className="mt-2 text-sm text-[#A6A1BC]">
              Aktivitas peminjamanmu akan muncul di sini.
            </p>

            <Link
              href="/mahasiswa/katalog"
              className="mt-5 inline-block rounded-full bg-[#A78BFA] px-6 py-3 text-sm font-semibold text-[#151229] transition hover:bg-purple-300"
            >
              Jelajahi Katalog
            </Link>

          </div>

        ) : (

          <div className="space-y-5">

            {riwayat.map((item) => (

              <article
                key={`${item.loan_item_id}-${item.fine_id || "no-fine"}`}
                className="overflow-hidden rounded-2xl border border-white/5 bg-[#211D39]"
              >

                {/* HEADER TRANSAKSI */}

                <div className="flex flex-col gap-3 border-b border-white/5 bg-[#292342] p-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs text-[#827A9B]">
                      Kode Peminjaman
                    </p>

                    <p className="mt-1 font-semibold text-[#F5F0E8]">
                      {item.kode_pinjam}
                    </p>

                  </div>

                  <div className="flex flex-wrap items-center gap-2">

                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(item.loan_status)}`}
                    >
                      {getStatusLabel(item.loan_status)}
                    </span>

                  </div>

                </div>

                {/* DETAIL BUKU */}

                <div className="p-5">

                  <div className="flex flex-col gap-5 sm:flex-row">

                    {/* COVER */}

                    <div className="flex h-44 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-[#151229]">

                      {item.sampul ? (

                        <img
                          src={item.sampul}
                          alt={`Sampul ${item.judul}`}
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <div className="p-3 text-center text-xs text-[#827A9B]">
                          Sampul tidak tersedia
                        </div>

                      )}

                    </div>

                    {/* INFORMASI BUKU */}

                    <div className="min-w-0 flex-1">

                      <h3 className="text-lg font-bold leading-snug">
                        {item.judul}
                      </h3>

                      <p className="mt-1 text-sm text-[#A6A1BC]">
                        {item.penulis}
                      </p>

                      <div className="mt-4 space-y-2 text-sm">

                        <div className="flex flex-wrap justify-between gap-2">

                          <span className="text-[#827A9B]">
                            Kode Eksemplar
                          </span>

                          <span className="font-medium text-[#D6D1E5]">
                            {item.kode_eksemplar}
                          </span>

                        </div>

                        <div className="flex flex-wrap justify-between gap-2">

                          <span className="text-[#827A9B]">
                            Tanggal Pengajuan
                          </span>

                          <span className="text-[#D6D1E5]">
                            {formatTanggalWaktu(item.tanggal_pengajuan)}
                          </span>

                        </div>

                        <div className="flex flex-wrap justify-between gap-2">

                          <span className="text-[#827A9B]">
                            Tanggal Pinjam
                          </span>

                          <span className="text-[#D6D1E5]">
                            {formatTanggal(item.tanggal_pinjam)}
                          </span>

                        </div>

                        <div className="flex flex-wrap justify-between gap-2">

                          <span className="text-[#827A9B]">
                            Jatuh Tempo
                          </span>

                          <span className="text-[#D6D1E5]">
                            {formatTanggal(item.jatuh_tempo)}
                          </span>

                        </div>

                        <div className="flex flex-wrap justify-between gap-2">

                          <span className="text-[#827A9B]">
                            Tanggal Pengembalian
                          </span>

                          <span className="text-[#D6D1E5]">
                            {formatTanggalWaktu(item.tanggal_kembali)}
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                {/* PENOLAKAN */}

                {item.loan_status === "ditolak" && item.alasan_penolakan && (

                  <div className="border-t border-rose-500/10 bg-rose-500/5 p-4">

                    <p className="text-sm font-semibold text-rose-400">
                      Alasan Penolakan
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-[#D6D1E5]">
                      {item.alasan_penolakan}
                    </p>

                  </div>

                )}

                {/* DENDA */}

                {item.fine_id && (

                  <div className="border-t border-white/5 p-5">

                    <div className="mb-4 flex items-center gap-2">

                      <span className="text-xl">
                        💰
                      </span>

                      <h4 className="font-semibold">
                        Informasi Denda
                      </h4>

                    </div>

                    <div className="rounded-xl border border-white/5 bg-[#151229] p-4">

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                        <div>

                          <p className="text-xs text-[#827A9B]">
                            Jenis Denda
                          </p>

                          <p className="mt-1 text-sm font-medium text-[#D6D1E5]">
                            {item.fine_jenis}
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-[#827A9B]">
                            Hari Terlambat
                          </p>

                          <p className="mt-1 text-sm font-medium text-[#D6D1E5]">
                            {item.hari_terlambat} hari
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-[#827A9B]">
                            Tarif
                          </p>

                          <p className="mt-1 text-sm font-medium text-[#D6D1E5]">
                            {formatRupiah(item.tarif_per_hari)}
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-[#827A9B]">
                            Total Denda
                          </p>

                          <p className="mt-1 text-lg font-bold text-[#FF6387]">
                            {formatRupiah(item.jumlah_denda)}
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-[#827A9B]">
                            Status
                          </p>

                          <span
                            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getFineStatusStyle(item.fine_status)}`}
                          >
                            {getFineStatusLabel(item.fine_status)}
                          </span>

                        </div>

                        <div>

                          <p className="text-xs text-[#827A9B]">
                            Pembayaran
                          </p>

                          <p className="mt-1 text-sm text-[#D6D1E5]">
                            {formatTanggalWaktu(item.dibayar_at)}
                          </p>

                        </div>

                      </div>

                      {item.alasan_penghapusan && (

                        <div className="mt-4 border-t border-white/5 pt-4">

                          <p className="text-xs text-[#827A9B]">
                            Alasan Penghapusan
                          </p>

                          <p className="mt-1 text-sm text-[#D6D1E5]">
                            {item.alasan_penghapusan}
                          </p>

                        </div>

                      )}

                    </div>

                  </div>

                )}

          {/* REVIEW */}

{item.tanggal_kembali && (

  <div className="border-t border-white/5 p-5">

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

      <div>

        <h4 className="font-semibold">
          Ulasan Buku
        </h4>

        <p className="mt-1 text-xs text-[#827A9B]">
          Ulasan untuk buku yang telah dikembalikan.
        </p>

      </div>

      {item.rating ? (

        <div className="rounded-xl bg-amber-500/10 px-4 py-3">

          <div className="text-lg text-amber-400">
            {"★".repeat(Number(item.rating))}
            {"☆".repeat(5 - Number(item.rating))}
          </div>

          <p className="mt-1 text-xs text-[#A6A1BC]">
            {item.rating}/5
          </p>

        </div>

      ) : (

        <span className="rounded-full bg-gray-500/10 px-3 py-2 text-xs text-gray-400">
          Belum diulas
        </span>

      )}

    </div>

    {/* REVIEW YANG SUDAH ADA */}

    {item.review_komentar && (

      <div className="mt-4 rounded-xl bg-[#151229] p-4">

        <p className="text-sm leading-relaxed text-[#D6D1E5]">
          {item.review_komentar}
        </p>

        <p className="mt-3 text-xs text-[#827A9B]">
          {formatTanggalWaktu(item.review_created_at)}
        </p>

      </div>

    )}

    {/* FORM REVIEW */}

    {!item.rating && (

      <div className="mt-4">

        <p className="mb-4 text-sm text-[#D6D1E5]">
          Buku ini sudah dikembalikan! Bagikan pendapatmu
          tentang buku ini.
        </p>

        <ReviewForm
          loanItemId={item.loan_item_id}
        />

      </div>

    )}

  </div>

)}

              </article>

            ))}

          </div>

        )}

      </section>

      {/* FOOTER */}

      <section className="rounded-2xl border border-white/5 bg-[#211D39] p-5">

        <p className="text-sm text-[#A6A1BC]">
          Menampilkan {totalTransaksi} item peminjaman dari akunmu.
        </p>

      </section>

    </div>
  );
}