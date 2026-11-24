"use client";

import { useEffect, useState } from "react";
import { getAdminDashboardData } from "@/app/actions/dashboard";

const STATUS = {
  menunggu_konfirmasi: {
    label: "Menunggu Konfirmasi",
    color: "bg-[#F5B544]/15 text-[#F5B544]",
  },
  sedang_dipinjam: {
    label: "Sedang Dipinjam",
    color: "bg-[#4DA3FF]/15 text-[#70B5FF]",
  },
  selesai: {
    label: "Selesai",
    color: "bg-[#2BB5A0]/15 text-[#2BB5A0]",
  },
  ditolak: {
    label: "Ditolak",
    color: "bg-[#FF6B8B]/15 text-[#FF829D]",
  },
};

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const overviewCards = [
  {
    key: "total_buku",
    label: "Total Judul Buku",
    description: "Buku dalam koleksi",
    color: "text-[#FF6B8B]",
    icon: "▤",
  },
  {
    key: "total_eksemplar",
    label: "Total Eksemplar",
    description: "Seluruh salinan buku",
    color: "text-[#F5B544]",
    icon: "▥",
  },
  {
    key: "total_mahasiswa",
    label: "Total Mahasiswa",
    description: "Akun mahasiswa terdaftar",
    color: "text-[#4DA3FF]",
    icon: "♙",
  },
  {
    key: "transaksi_aktif",
    label: "Transaksi Aktif",
    description: "Menunggu dan sedang dipinjam",
    color: "text-[#2BB5A0]",
    icon: "↗",
  },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const result = await getAdminDashboardData();
      setData(result);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const cardClass =
    "rounded-2xl border border-white/10 bg-[#211C45] p-5 sm:p-6";

  const maxMonthly = Math.max(
    1,
    ...(data?.monthly || []).map((item) =>
      Number(item.jumlah_peminjaman)
    )
  );

  const maxCategory = Math.max(
    1,
    ...(data?.categories || []).map((item) =>
      Number(item.jumlah_buku)
    )
  );

return (
  <div className="min-h-screen min-w-0 bg-[#14112B] text-white">
    <main className="min-w-0 p-5 pt-20 sm:p-6 sm:pt-20 lg:p-10">

        {/* HEADER */}
        <header className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-[#FF6B8B]">
              Administration Overview
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Dashboard Admin
            </h1>

            <p className="mt-2 text-gray-400">
              Ringkasan aktivitas dan pengelolaan perpustakaan BOOKLYN.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            ↻ Refresh Data
          </button>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-[#FF6B8B]/30 bg-[#FF6B8B]/10 p-4 text-sm text-[#FF829D]">
            {error}
          </div>
        )}

        {/* OVERVIEW CARDS */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <div key={card.key} className={cardClass}>
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-400">
                  {card.label}
                </p>

                <span className={`text-2xl ${card.color}`}>
                  {card.icon}
                </span>
              </div>

              <h2 className={`mt-5 text-3xl font-bold ${card.color}`}>
                {loading ? "—" : data?.overview?.[card.key] ?? 0}
              </h2>

              <p className="mt-2 text-xs text-gray-500">
                {card.description}
              </p>
            </div>
          ))}
        </section>

        {/* TRANSACTION STATUS */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className={cardClass}>
            <p className="text-sm text-gray-400">
              Menunggu Konfirmasi
            </p>

            <h3 className="mt-3 text-3xl font-bold text-[#F5B544]">
              {loading ? "—" : data?.overview?.menunggu_konfirmasi ?? 0}
            </h3>

            <p className="mt-2 text-xs text-gray-500">
              Pengajuan yang belum diproses
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-gray-400">
              Sedang Dipinjam
            </p>

            <h3 className="mt-3 text-3xl font-bold text-[#4DA3FF]">
              {loading ? "—" : data?.overview?.sedang_dipinjam ?? 0}
            </h3>

            <p className="mt-2 text-xs text-gray-500">
              Transaksi peminjaman berjalan
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-gray-400">
              Peminjaman Terlambat
            </p>

            <h3 className="mt-3 text-3xl font-bold text-[#FF6B8B]">
              {loading ? "—" : data?.overview?.peminjaman_terlambat ?? 0}
            </h3>

            <p className="mt-2 text-xs text-gray-500">
              Melewati tanggal jatuh tempo
            </p>
          </div>

        </section>

        {/* FINE SUMMARY */}
        <section className={`${cardClass} mb-8`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-gray-400">
                Total Denda Terkumpul
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[#2BB5A0]">
                {loading
                  ? "—"
                  : formatRupiah(data?.overview?.total_denda_lunas)}
              </h2>

              <p className="mt-2 text-xs text-gray-500">
                Akumulasi denda dengan status lunas
              </p>
            </div>

            <span className="text-4xl text-[#2BB5A0]">
              Rp
            </span>
          </div>
        </section>

        {/* CHARTS */}
        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* MONTHLY LOANS */}
          <div className={cardClass}>
            <div className="mb-7">
              <h2 className="text-xl font-bold">
                Aktivitas Peminjaman
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Jumlah pengajuan dalam enam bulan terakhir
              </p>
            </div>

            {loading ? (
              <div className="flex h-56 items-center justify-center text-sm text-gray-500">
                Memuat grafik...
              </div>
            ) : (
              <div className="flex h-56 items-end justify-around gap-3 border-b border-white/10 pb-2">

                {(data?.monthly || []).map((item, index) => {
                  const count = Number(item.jumlah_peminjaman);
                  const height = Math.max(
                    count > 0 ? 8 : 2,
                    (count / maxMonthly) * 100
                  );

                  return (
                    <div
                      key={`${item.bulan}-${index}`}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                    >
                      <span className="text-xs text-gray-400">
                        {count}
                      </span>

                      <div
                        className="w-full max-w-12 rounded-t-lg bg-[#FF6B8B] transition-all duration-500"
                        style={{ height: `${height}%` }}
                        title={`${count} peminjaman`}
                      />

                      <span className="text-xs text-gray-400">
                        {item.bulan}
                      </span>
                    </div>
                  );
                })}

              </div>
            )}
          </div>

          {/* CATEGORY DISTRIBUTION */}
          <div className={cardClass}>
            <div className="mb-7">
              <h2 className="text-xl font-bold">
                Distribusi Kategori
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Jumlah judul buku berdasarkan kategori
              </p>
            </div>

            {loading ? (
              <div className="flex h-56 items-center justify-center text-sm text-gray-500">
                Memuat kategori...
              </div>
            ) : data?.categories?.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-gray-500">
                Belum ada kategori.
              </div>
            ) : (
              <div className="space-y-5">
                {data?.categories?.map((category) => {
                  const count = Number(category.jumlah_buku);
                  const width = (count / maxCategory) * 100;

                  return (
                    <div key={category.id}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-gray-300">
                          {category.nama_kategori}
                        </span>

                        <span className="font-semibold text-[#FF6B8B]">
                          {count}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#FF6B8B] transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

        {/* RECENT ACTIVITIES AND ATTENTION */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* RECENT TRANSACTIONS */}
          <div className={cardClass}>
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                Aktivitas Terbaru
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Enam transaksi peminjaman terakhir
              </p>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Memuat aktivitas...
              </p>
            ) : data?.recent?.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="font-semibold">
                  Belum ada aktivitas
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Aktivitas peminjaman akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.recent?.map((item) => {
                  const status = STATUS[item.status] || {
                    label: item.status,
                    color: "bg-white/10 text-gray-400",
                  };

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {item.nama_mahasiswa}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.kode_pinjam} · {item.jumlah_buku} buku
                        </p>

                        <p className="mt-1 truncate text-xs text-gray-500">
                          {item.daftar_buku || "Belum ada detail buku"}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>

                        <span className="text-xs text-gray-500">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ATTENTION */}
          <div className={cardClass}>
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                Perlu Perhatian
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Pengajuan menunggu dan peminjaman terlambat
              </p>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Memuat data...
              </p>
            ) : data?.attention?.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="font-semibold text-[#2BB5A0]">
                  Semua terkendali!
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Tidak ada transaksi yang memerlukan perhatian.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.attention?.map((item) => {
                  const isLate = item.jenis_perhatian === "Terlambat";

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-semibold">
                            {item.nama_mahasiswa}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.kode_pinjam}
                          </p>

                          <p className="mt-2 text-xs text-gray-500">
                            {isLate
                              ? `Jatuh tempo: ${formatDate(item.jatuh_tempo)}`
                              : `Diajukan: ${formatDate(item.created_at)}`}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                            isLate
                              ? "bg-[#FF6B8B]/15 text-[#FF829D]"
                              : "bg-[#F5B544]/15 text-[#F5B544]"
                          }`}
                        >
                          {item.jenis_perhatian}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

        {/* FOOTER */}
        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-gray-500">
          BOOKLYN Administration Dashboard
        </footer>

      </main>
    </div>
  );
}