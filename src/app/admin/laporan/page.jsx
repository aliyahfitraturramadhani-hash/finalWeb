"use client";

import { useEffect, useMemo, useState } from "react";
import { getTransactions } from "@/app/actions/transactions";

const STATUS = {
  menunggu_konfirmasi: "Menunggu Konfirmasi",
  sedang_dipinjam: "Sedang Dipinjam",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function escapeCSV(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function AdminReportPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // FILTER DETAIL TRANSAKSI
const [transactionSearch, setTransactionSearch] = useState("");
const [transactionStatus, setTransactionStatus] = useState("semua");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError(err.message || "Gagal mengambil data laporan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // FILTER PERIODE
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const date = transaction.created_at
        ? new Date(transaction.created_at)
        : null;

      const start = startDate
        ? new Date(`${startDate}T00:00:00`)
        : null;

      const end = endDate
        ? new Date(`${endDate}T23:59:59`)
        : null;

      return (
        (!start || (date && date >= start)) &&
        (!end || (date && date <= end))
      );
    });
  }, [transactions, startDate, endDate]);

// FILTER DETAIL REKAP TRANSAKSI
const tableFilteredTransactions = useMemo(() => {
  return filteredTransactions.filter((transaction) => {
    const search = transactionSearch.toLowerCase().trim();

    const matchesSearch =
      !search ||
      transaction.kode_pinjam?.toLowerCase().includes(search) ||
      transaction.nama_mahasiswa?.toLowerCase().includes(search) ||
      transaction.nomor_identitas?.toLowerCase().includes(search) ||
      transaction.email_mahasiswa?.toLowerCase().includes(search) ||
      (transaction.daftar_buku || []).some((book) =>
        book.judul?.toLowerCase().includes(search)
      );

    const matchesStatus =
      transactionStatus === "semua" ||
      transaction.status === transactionStatus;

    return matchesSearch && matchesStatus;
  });
}, [filteredTransactions, transactionSearch, transactionStatus]);

// RESET PAGINATION SAAT FILTER BERUBAH
useEffect(() => {
  setCurrentPage(1);
}, [startDate, endDate, transactionSearch, transactionStatus]);

  // STATISTICS
  const statistics = useMemo(() => {
    const total = filteredTransactions.length;

    const menunggu = filteredTransactions.filter(
      (item) => item.status === "menunggu_konfirmasi"
    ).length;

    const dipinjam = filteredTransactions.filter(
      (item) => item.status === "sedang_dipinjam"
    ).length;

    const selesai = filteredTransactions.filter(
      (item) => item.status === "selesai"
    ).length;

    const ditolak = filteredTransactions.filter(
      (item) => item.status === "ditolak"
    ).length;

    const totalDenda = filteredTransactions.reduce(
      (sum, item) => sum + Number(item.total_denda || 0),
      0
    );

    const dendaBelumDibayar = filteredTransactions.reduce(
      (sum, item) => sum + Number(item.denda_belum_dibayar || 0),
      0
    );

    const dendaLunas = filteredTransactions.reduce(
      (sum, item) => sum + Number(item.denda_lunas || 0),
      0
    );

    const totalBuku = filteredTransactions.reduce(
      (sum, item) => sum + Number(item.jumlah_buku || 0),
      0
    );

    return {
      total,
      menunggu,
      dipinjam,
      selesai,
      ditolak,
      totalDenda,
      dendaBelumDibayar,
      dendaLunas,
      totalBuku,
    };
  }, [filteredTransactions]);

  // POPULAR BOOKS
  const popularBooks = useMemo(() => {
    const bookMap = {};

    filteredTransactions.forEach((transaction) => {
      (transaction.daftar_buku || []).forEach((book) => {
        const title = book.judul || "Judul Tidak Diketahui";

        bookMap[title] = (bookMap[title] || 0) + 1;
      });
    });

    return Object.entries(bookMap)
      .map(([judul, jumlah]) => ({ judul, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 10);
  }, [filteredTransactions]);

  // PAGINATION
  const totalPages = Math.ceil(
    filteredTransactions.length / ITEMS_PER_PAGE
  );

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  const startItem =
    filteredTransactions.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredTransactions.length
  );

  // EXPORT CSV
  function exportCSV() {
    if (filteredTransactions.length === 0) return;

    const headers = [
      "Kode Transaksi",
      "Nama Mahasiswa",
      "Email",
      "Nomor Identitas",
      "Buku",
      "Jumlah Buku",
      "Tanggal Pengajuan",
      "Tanggal Pinjam",
      "Jatuh Tempo",
      "Status",
      "Total Denda",
      "Denda Belum Dibayar",
      "Denda Lunas",
      "Petugas",
    ];

    const rows = filteredTransactions.map((transaction) => [
      transaction.kode_pinjam,
      transaction.nama_mahasiswa,
      transaction.email_mahasiswa,
      transaction.nomor_identitas,
      (transaction.daftar_buku || [])
        .map((book) => book.judul)
        .join("; "),
      transaction.jumlah_buku,
      formatDate(transaction.created_at),
      formatDate(transaction.tanggal_pinjam),
      formatDate(transaction.jatuh_tempo),
      STATUS[transaction.status] || transaction.status,
      transaction.total_denda,
      transaction.denda_belum_dibayar,
      transaction.denda_lunas,
      transaction.nama_petugas,
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "BOOKLYN_Laporan.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const cardData = [
    {
      label: "Total Transaksi",
      value: statistics.total,
      color: "#FF6B8B",
      icon: "↗",
    },
    {
      label: "Total Buku Dipinjam",
      value: statistics.totalBuku,
      color: "#4DA3FF",
      icon: "▣",
    },
    {
      label: "Transaksi Selesai",
      value: statistics.selesai,
      color: "#2BB5A0",
      icon: "✓",
    },
    {
      label: "Transaksi Ditolak",
      value: statistics.ditolak,
      color: "#F5B544",
      icon: "×",
    },
  ];

  const statusData = [
    {
      label: "Menunggu Konfirmasi",
      value: statistics.menunggu,
      color: "#F5B544",
    },
    {
      label: "Sedang Dipinjam",
      value: statistics.dipinjam,
      color: "#4DA3FF",
    },
    {
      label: "Selesai",
      value: statistics.selesai,
      color: "#2BB5A0",
    },
    {
      label: "Ditolak",
      value: statistics.ditolak,
      color: "#FF6B8B",
    },
  ];

  return (
    <div className="min-h-screen min-w-0 bg-[#14112B] text-white">
      <main className="min-w-0 p-5 pt-20 sm:p-6 sm:pt-20 lg:p-10">

        {/* HEADER */}
        <header className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-[#2BB5A0]">
              Analytics & Reporting
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Laporan Perpustakaan
            </h1>

            <p className="mt-2 text-gray-400">
              Rekapitulasi aktivitas dan statistik BOOKLYN.
            </p>
          </div>

          <button
            onClick={exportCSV}
            disabled={filteredTransactions.length === 0}
            className="rounded-xl bg-[#2BB5A0] px-5 py-3 font-semibold text-[#211C45] transition hover:bg-[#48c8b4] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↓ Ekspor Laporan CSV
          </button>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-[#FF6B8B]/30 bg-[#FF6B8B]/10 p-4 text-[#FF829D]">
            {error}
          </div>
        )}

        {/* FILTER */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#211C45] p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold">
              Filter Periode Laporan
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Pilih rentang tanggal pengajuan transaksi.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm text-gray-400">
                Tanggal Mulai
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#14112B] px-4 py-3 text-white outline-none focus:border-[#2BB5A0]"
              />
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-sm text-gray-400">
                Tanggal Akhir
              </label>

              <input
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#14112B] px-4 py-3 text-white outline-none focus:border-[#2BB5A0]"
              />
            </div>

            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="rounded-xl border border-white/10 px-5 py-3 text-gray-300 transition hover:bg-white/5"
            >
              Reset
            </button>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cardData.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-white/10 bg-[#211C45] p-6 transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {card.label}
                </p>

                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl"
                  style={{ color: card.color }}
                >
                  {card.icon}
                </span>
              </div>

              <h2
                className="mt-4 text-3xl font-bold"
                style={{ color: card.color }}
              >
                {loading ? "—" : card.value}
              </h2>

              <p className="mt-2 text-xs text-gray-500">
                Berdasarkan periode yang dipilih
              </p>
            </article>
          ))}
        </section>

        {/* FINE REPORT */}
        <section className="mb-8">
          <h2 className="mb-5 text-xl font-bold">
            Rekapitulasi Denda
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-[#FF6B8B]/20 bg-gradient-to-br from-[#FF6B8B]/10 to-[#211C45] p-6">
              <p className="text-sm text-gray-400">
                Total Denda
              </p>

              <h3 className="mt-3 text-2xl font-bold text-[#FF6B8B]">
                {loading ? "—" : formatRupiah(statistics.totalDenda)}
              </h3>
            </article>

            <article className="rounded-2xl border border-[#F5B544]/20 bg-gradient-to-br from-[#F5B544]/10 to-[#211C45] p-6">
              <p className="text-sm text-gray-400">
                Belum Dibayar
              </p>

              <h3 className="mt-3 text-2xl font-bold text-[#F5B544]">
                {loading ? "—" : formatRupiah(statistics.dendaBelumDibayar)}
              </h3>
            </article>

            <article className="rounded-2xl border border-[#2BB5A0]/20 bg-gradient-to-br from-[#2BB5A0]/10 to-[#211C45] p-6">
              <p className="text-sm text-gray-400">
                Denda Lunas
              </p>

              <h3 className="mt-3 text-2xl font-bold text-[#2BB5A0]">
                {loading ? "—" : formatRupiah(statistics.dendaLunas)}
              </h3>
            </article>
          </div>
        </section>

        {/* STATUS REPORT */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#211C45] p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              Distribusi Status Transaksi
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Ringkasan status peminjaman dalam periode terpilih.
            </p>
          </div>

          <div className="space-y-5">
            {statusData.map((item) => {
              const percentage =
                statistics.total > 0
                  ? (item.value / statistics.total) * 100
                  : 0;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-300">
                      {item.label}
                    </span>

                    <span className="text-sm font-semibold">
                      {loading ? "—" : item.value}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#14112B]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {loading ? "—" : `${percentage.toFixed(1)}%`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* POPULAR BOOKS */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#211C45] p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              Buku Paling Sering Dipinjam
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Berdasarkan jumlah transaksi buku dalam periode terpilih.
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-400">
              Memuat statistik buku...
            </div>
          ) : popularBooks.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              Belum ada data peminjaman buku.
            </div>
          ) : (
            <div className="space-y-4">
              {popularBooks.map((book, index) => {
                const max = popularBooks[0]?.jumlah || 1;
                const percentage = (book.jumlah / max) * 100;

                return (
                  <div key={book.judul}>
                    <div className="mb-2 flex items-center gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-[#2BB5A0]">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {book.judul}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-[#2BB5A0]">
                        {book.jumlah} kali
                      </span>
                    </div>

                    <div className="ml-12 h-2 overflow-hidden rounded-full bg-[#14112B]">
                      <div
                        className="h-full rounded-full bg-[#2BB5A0] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* TRANSACTION TABLE */}
<section className="rounded-2xl border border-white/10 bg-[#211C45]">

  {/* TABLE HEADER */}
  <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-6 sm:flex-row sm:items-center">
    <div>
      <h2 className="text-xl font-bold">
        Detail Rekap Transaksi
      </h2>

      <p className="mt-1 text-sm text-gray-400">
        {tableFilteredTransactions.length} transaksi ditemukan
      </p>
    </div>

    <button
      onClick={loadData}
      disabled={loading}
      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 disabled:opacity-40"
    >
      ↻ Refresh
    </button>
  </div>

  {/* FILTER */}
  <div className="flex flex-col gap-3 border-b border-white/10 p-5 lg:flex-row">

    {/* SEARCH */}
    <div className="relative flex-1">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        ⌕
      </span>

      <input
        type="text"
        value={transactionSearch}
        onChange={(e) => setTransactionSearch(e.target.value)}
        placeholder="Cari kode, mahasiswa, NIM, atau buku..."
        className="w-full rounded-xl border border-white/10 bg-[#14112B] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-[#F5B544]"
      />
    </div>

    {/* STATUS FILTER */}
    <select
      value={transactionStatus}
      onChange={(e) => setTransactionStatus(e.target.value)}
      className="rounded-xl border border-white/10 bg-[#14112B] px-4 py-3 text-sm text-white outline-none transition focus:border-[#F5B544] lg:w-64"
    >
      <option value="semua">Semua Status</option>
      <option value="menunggu_konfirmasi">
        Menunggu Konfirmasi
      </option>
      <option value="sedang_dipinjam">
        Sedang Dipinjam
      </option>
      <option value="selesai">
        Selesai
      </option>
      <option value="ditolak">
        Ditolak
      </option>
    </select>

    {/* RESET FILTER */}
    <button
      type="button"
      onClick={() => {
        setTransactionSearch("");
        setTransactionStatus("semua");
      }}
      className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
    >
      ↻ Reset Filter
    </button>

  </div>

  {/* TABLE CONTENT */}
  {loading ? (

    <div className="p-12 text-center text-gray-400">
      Memuat data laporan...
    </div>

  ) : tableFilteredTransactions.length === 0 ? (

    <div className="p-12 text-center text-gray-400">
      Tidak ada transaksi yang cocok dengan filter.
    </div>

  ) : (

    <>

      {/* TABLE */}
      <div className="overflow-x-auto">

        <table className="w-full min-w-[950px] text-left">

          <thead className="border-b border-white/10 bg-white/[0.03]">
            <tr className="text-xs uppercase tracking-wider text-gray-400">
              <th className="px-5 py-4">Kode</th>
              <th className="px-5 py-4">Mahasiswa</th>
              <th className="px-5 py-4">Buku</th>
              <th className="px-5 py-4">Tanggal</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Denda</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">

            {tableFilteredTransactions
              .slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE
              )
              .map((transaction) => (

                <tr
                  key={transaction.id}
                  className="transition hover:bg-white/[0.03]"
                >

                  {/* KODE */}
                  <td className="px-5 py-4">
                    <p className="font-semibold">
                      {transaction.kode_pinjam}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(transaction.created_at)}
                    </p>
                  </td>

                  {/* MAHASISWA */}
                  <td className="px-5 py-4">
                    <p className="font-medium">
                      {transaction.nama_mahasiswa}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {transaction.nomor_identitas || "-"}
                    </p>
                  </td>

                  {/* BUKU */}
                  <td className="px-5 py-4">
                    <p className="max-w-[250px] truncate">
                      {(transaction.daftar_buku || [])
                        .map((book) => book.judul)
                        .join(", ") || "-"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {transaction.jumlah_buku || 0} eksemplar
                    </p>
                  </td>

                  {/* TANGGAL */}
                  <td className="px-5 py-4 text-sm text-gray-400">
                    <p>
                      Pinjam: {formatDate(transaction.tanggal_pinjam)}
                    </p>

                    <p className="mt-1">
                      Tempo: {formatDate(transaction.jatuh_tempo)}
                    </p>
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-4">
                    <span
                      className={`text-sm font-medium ${
                        transaction.status === "menunggu_konfirmasi"
                          ? "text-[#F5B544]"
                          : transaction.status === "sedang_dipinjam"
                          ? "text-[#4DA3FF]"
                          : transaction.status === "selesai"
                          ? "text-[#2BB5A0]"
                          : transaction.status === "ditolak"
                          ? "text-[#FF6B8B]"
                          : "text-gray-300"
                      }`}
                    >
                      {STATUS[transaction.status] || transaction.status}
                    </span>
                  </td>

                  {/* DENDA */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#FF6B8B]">
                      {formatRupiah(transaction.total_denda)}
                    </p>

                    {Number(transaction.denda_belum_dibayar || 0) > 0 && (
                      <p className="mt-1 text-xs text-[#F5B544]">
                        Belum lunas
                      </p>
                    )}
                  </td>

                </tr>

              ))}

          </tbody>

        </table>

      </div>

      {/* PAGINATION */}
      {(() => {
        const tableTotalPages = Math.ceil(
          tableFilteredTransactions.length / ITEMS_PER_PAGE
        );

        const tableStartItem =
          tableFilteredTransactions.length === 0
            ? 0
            : (currentPage - 1) * ITEMS_PER_PAGE + 1;

        const tableEndItem = Math.min(
          currentPage * ITEMS_PER_PAGE,
          tableFilteredTransactions.length
        );

        return (

          <div className="flex flex-col justify-between gap-4 border-t border-white/10 p-5 sm:flex-row sm:items-center">

            {/* INFORMATION */}
            <p className="text-sm text-gray-400">
              Menampilkan{" "}
              <span className="font-semibold text-white">
                {tableStartItem}-{tableEndItem}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-white">
                {tableFilteredTransactions.length}
              </span>{" "}
              transaksi
            </p>

            {/* BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-2">

              {/* PREVIOUS */}
              <button
                onClick={() =>
                  setCurrentPage((previous) =>
                    Math.max(previous - 1, 1)
                  )
                }
                disabled={currentPage === 1}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Prev
              </button>

              {/* PAGE NUMBERS */}
              {Array.from(
                { length: tableTotalPages },
                (_, index) => index + 1
              ).map((page) => (

                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    currentPage === page
                      ? "bg-[#2BB5A0] text-[#14112B]"
                      : "border border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {page}
                </button>

              ))}

              {/* NEXT */}
              <button
                onClick={() =>
                  setCurrentPage((previous) =>
                    Math.min(previous + 1, tableTotalPages)
                  )
                }
                disabled={currentPage === tableTotalPages}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>

            </div>

          </div>

        );
      })()}

    </>

  )}

</section>


        {/* FOOTER */}
        <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-gray-500 sm:flex-row">
          <p>BOOKLYN · Library Analytics</p>

          <p>
            {startDate || endDate
              ? `Periode ${startDate ? formatDate(startDate) : "awal"} — ${
                  endDate ? formatDate(endDate) : "akhir"
                }`
              : "Semua periode"}
          </p>
        </footer>

      </main>
    </div>
  );
}
