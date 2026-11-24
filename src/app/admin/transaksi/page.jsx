"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getTransactions,
  getTransactionSummary,
} from "@/app/actions/transactions";

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

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "menunggu_konfirmasi", label: "Menunggu" },
  { value: "sedang_dipinjam", label: "Dipinjam" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
];

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

export default function TransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const TRANSACTIONS_PER_PAGE = 8;

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      setCurrentPage(1);

      const [transactionData, summaryData] = await Promise.all([
        getTransactions(),
        getTransactionSummary(),
      ]);

      setTransactions(transactionData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "Gagal memuat data transaksi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // FILTER TRANSACTIONS
  const filteredTransactions = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.kode_pinjam?.toLowerCase().includes(keyword) ||
        transaction.nama_mahasiswa?.toLowerCase().includes(keyword) ||
        transaction.email_mahasiswa?.toLowerCase().includes(keyword) ||
        transaction.nomor_identitas?.toLowerCase().includes(keyword) ||
        transaction.daftar_buku?.some((book) =>
          book.judul?.toLowerCase().includes(keyword)
        );

      const matchesStatus =
        activeStatus === "all" ||
        transaction.status === activeStatus;

      const transactionDate = transaction.created_at
        ? new Date(transaction.created_at)
        : null;

      const matchesStart =
        !startDate ||
        (transactionDate &&
          transactionDate >= new Date(`${startDate}T00:00:00`));

      const matchesEnd =
        !endDate ||
        (transactionDate &&
          transactionDate <= new Date(`${endDate}T23:59:59`));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [
    transactions,
    search,
    activeStatus,
    startDate,
    endDate,
  ]);

  // PAGINATION
  const totalPages = Math.ceil(
    filteredTransactions.length / TRANSACTIONS_PER_PAGE
  );

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * TRANSACTIONS_PER_PAGE,
    currentPage * TRANSACTIONS_PER_PAGE
  );

  const startIndex =
    filteredTransactions.length === 0
      ? 0
      : (currentPage - 1) * TRANSACTIONS_PER_PAGE + 1;

  const endIndex = Math.min(
    currentPage * TRANSACTIONS_PER_PAGE,
    filteredTransactions.length
  );

  // EXPORT CSV
  function exportCSV() {
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
      transaction.daftar_buku
        .map((book) => book.judul)
        .join("; "),
      transaction.jumlah_buku,
      formatDate(transaction.created_at),
      formatDate(transaction.tanggal_pinjam),
      formatDate(transaction.jatuh_tempo),
      STATUS[transaction.status]?.label || transaction.status,
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
    link.download = "BOOKLYN_Log_Transaksi.csv";

    link.click();

    URL.revokeObjectURL(url);
  }

  // SUMMARY CARDS
  const summaryCards = summary
    ? [
        {
          label: "Total Transaksi",
          value: summary.total_transaksi,
          color: "text-[#FF6B8B]",
        },
        {
          label: "Menunggu Konfirmasi",
          value: summary.menunggu_konfirmasi,
          color: "text-[#F5B544]",
        },
        {
          label: "Sedang Dipinjam",
          value: summary.sedang_dipinjam,
          color: "text-[#4DA3FF]",
        },
        {
          label: "Selesai",
          value: summary.selesai,
          color: "text-[#2BB5A0]",
        },
      ]
    : [];

  const inputClass =
    "rounded-xl border border-white/10 bg-[#211C45] px-4 py-3 text-white outline-none focus:border-[#FF6B8B]";

  return (
    <div className="min-h-screen min-w-0 bg-[#14112B] text-white">
      <main className="min-w-0 p-5 pt-20 sm:p-6 sm:pt-20 lg:p-10">

        {/* HEADER */}
        <header className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-[#FF6B8B]">
              Transaction Monitoring
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Log Transaksi
            </h1>

            <p className="mt-2 text-gray-400">
              Monitoring seluruh transaksi peminjaman BOOKLYN.
            </p>
          </div>

          <button
            onClick={exportCSV}
            disabled={filteredTransactions.length === 0}
            className="rounded-xl bg-[#FF6B8B] px-5 py-3 font-semibold text-[#211C45] transition hover:bg-[#ff829d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↓ Ekspor CSV
          </button>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-[#FF6B8B]/30 bg-[#FF6B8B]/10 p-4 text-[#FF829D]">
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-[#211C45] p-5"
            >
              <p className="text-sm text-gray-400">
                {item.label}
              </p>

              <h2 className={`mt-3 text-3xl font-bold ${item.color}`}>
                {loading ? "—" : item.value}
              </h2>

              <p className="mt-2 text-xs text-gray-500">
                Data seluruh transaksi
              </p>
            </div>
          ))}
        </section>

        {/* FINE SUMMARY */}
        {summary && (
          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-[#211C45] p-5">
              <p className="text-sm text-gray-400">
                Total Denda
              </p>

              <h3 className="mt-3 text-2xl font-bold text-[#FF6B8B]">
                {formatRupiah(summary.total_denda)}
              </h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#211C45] p-5">
              <p className="text-sm text-gray-400">
                Belum Dibayar
              </p>

              <h3 className="mt-3 text-2xl font-bold text-[#F5B544]">
                {formatRupiah(summary.denda_belum_dibayar)}
              </h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#211C45] p-5">
              <p className="text-sm text-gray-400">
                Denda Lunas
              </p>

              <h3 className="mt-3 text-2xl font-bold text-[#2BB5A0]">
                {formatRupiah(summary.denda_lunas)}
              </h3>
            </div>

          </section>
        )}

        {/* STATUS FILTER */}
        <section className="mb-6">
          <p className="mb-3 text-sm text-gray-400">
            Filter status transaksi
          </p>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setActiveStatus(filter.value);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  activeStatus === filter.value
                    ? "bg-[#FF6B8B] text-[#211C45]"
                    : "border border-white/10 bg-[#211C45] text-gray-400 hover:bg-white/10"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* SEARCH AND DATE */}
        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto]">

          {/* SEARCH */}
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari kode transaksi, nama mahasiswa, atau judul buku..."
            className={inputClass}
          />

          {/* START DATE */}
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Tanggal mulai"
            className={inputClass}
          />

          {/* END DATE */}
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => {
              setEndDate(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Tanggal akhir"
            className={inputClass}
          />

        </section>

        {/* TABLE */}
        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Riwayat Peminjaman
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                {filteredTransactions.length} transaksi ditemukan
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-[#211C45] p-12 text-center text-gray-400">
              Memuat riwayat transaksi...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#211C45] p-12 text-center">
              <p className="text-lg font-semibold">
                Belum ada transaksi
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Data transaksi akan muncul di sini setelah ada pengajuan peminjaman.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#211C45]">

              <table className="w-full min-w-[1050px] text-left">

                <thead className="border-b border-white/10 bg-white/[0.03]">
                  <tr className="text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-5">Transaksi</th>
                    <th className="px-5 py-5">Mahasiswa</th>
                    <th className="px-5 py-5">Buku</th>
                    <th className="px-5 py-5">Tanggal</th>
                    <th className="px-5 py-5">Status</th>
                    <th className="px-5 py-5">Denda</th>
                    <th className="px-5 py-5">Detail</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">

                  {paginatedTransactions.map((transaction) => {
                    const status =
                      STATUS[transaction.status] || {
                        label: transaction.status,
                        color: "bg-white/10 text-gray-300",
                      };

                    return (
                      <tr
                        key={transaction.id}
                        className="transition hover:bg-white/[0.03]"
                      >

                        {/* TRANSACTION */}
                        <td className="px-5 py-5">
                          <p className="font-semibold">
                            {transaction.kode_pinjam}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(transaction.created_at)}
                          </p>
                        </td>

                        {/* STUDENT */}
                        <td className="px-5 py-5">
                          <p className="font-medium">
                            {transaction.nama_mahasiswa}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {transaction.nomor_identitas || "-"}
                          </p>
                        </td>

                        {/* BOOK */}
                        <td className="px-5 py-5">
                          <p className="max-w-[220px] truncate font-medium">
                            {transaction.daftar_buku
                              .map((book) => book.judul)
                              .join(", ") || "-"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {transaction.jumlah_buku} eksemplar
                          </p>
                        </td>

                        {/* DATE */}
                        <td className="px-5 py-5 text-sm text-gray-400">
                          <p>
                            Pinjam: {formatDate(transaction.tanggal_pinjam)}
                          </p>

                          <p className="mt-1">
                            Tempo: {formatDate(transaction.jatuh_tempo)}
                          </p>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-5">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* FINE */}
                        <td className="px-5 py-5">
                          <p className="font-semibold text-[#FF829D]">
                            {formatRupiah(transaction.total_denda)}
                          </p>

                          {transaction.denda_belum_dibayar > 0 && (
                            <p className="mt-1 text-xs text-[#F5B544]">
                              Belum lunas
                            </p>
                          )}
                        </td>

                        {/* DETAIL */}
                        <td className="px-5 py-5">
                          <button
                            onClick={() =>
                              setSelectedTransaction(transaction)
                            }
                            className="rounded-lg bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                          >
                            Lihat
                          </button>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>
            </div>
          )}

          {/* PAGINATION */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              {/* DATA INFORMATION */}
              <p className="text-sm text-gray-400">
                Menampilkan{" "}
                <span className="font-medium text-white">
                  {startIndex}-{endIndex}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-white">
                  {filteredTransactions.length}
                </span>{" "}
                transaksi
              </p>

              {/* PAGE BUTTONS */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center gap-2">

                  {/* PREVIOUS */}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-white/10 bg-[#211C45] px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ←
                  </button>

                  {/* PAGE NUMBERS */}
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        currentPage === page
                          ? "bg-[#FF6B8B] text-[#211C45]"
                          : "border border-white/10 bg-[#211C45] text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* NEXT */}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-white/10 bg-[#211C45] px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    →
                  </button>

                </div>
              )}

            </div>
          )}
        </section>

      </main>

      {/* DETAIL PANEL */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50">

          <button
            aria-label="Tutup detail"
            onClick={() => setSelectedTransaction(null)}
            className="absolute inset-0 bg-black/60"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#14112B] p-6 shadow-2xl">

            {/* PANEL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#FF6B8B]">
                  Transaction Detail
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Detail Transaksi
                </h2>
              </div>

              <button
                onClick={() => setSelectedTransaction(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-gray-300 hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <div className="mt-7 space-y-6">

              {/* TRANSACTION CODE */}
              <div>
                <p className="text-sm text-gray-400">
                  Kode Transaksi
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {selectedTransaction.kode_pinjam}
                </p>
              </div>

              {/* STUDENT */}
              <div>
                <p className="text-sm text-gray-400">
                  Mahasiswa
                </p>

                <p className="mt-2 font-semibold">
                  {selectedTransaction.nama_mahasiswa}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedTransaction.email_mahasiswa}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  ID: {selectedTransaction.nomor_identitas || "-"}
                </p>
              </div>

              {/* BOOKS */}
              <div>
                <p className="mb-3 text-sm text-gray-400">
                  Buku yang Dipinjam
                </p>

                <div className="space-y-3">
                  {selectedTransaction.daftar_buku.map((book) => (
                    <div
                      key={book.loan_item_id}
                      className="rounded-xl border border-white/10 bg-[#211C45] p-4"
                    >
                      <p className="font-semibold">
                        {book.judul}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {book.penulis}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        Eksemplar: {book.kode_eksemplar}
                      </p>

                      {book.tanggal_kembali && (
                        <p className="mt-2 text-xs text-[#2BB5A0]">
                          Dikembalikan: {formatDate(book.tanggal_kembali)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* LOAN DATES */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#211C45] p-4">
                  <p className="text-xs text-gray-400">
                    Tanggal Pinjam
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(selectedTransaction.tanggal_pinjam)}
                  </p>
                </div>

                <div className="rounded-xl bg-[#211C45] p-4">
                  <p className="text-xs text-gray-400">
                    Jatuh Tempo
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(selectedTransaction.jatuh_tempo)}
                  </p>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <p className="text-sm text-gray-400">
                  Status Transaksi
                </p>

                <p className="mt-2 font-semibold">
                  {STATUS[selectedTransaction.status]?.label ||
                    selectedTransaction.status}
                </p>
              </div>

              {/* REJECTION REASON */}
              {selectedTransaction.alasan_penolakan && (
                <div className="rounded-xl border border-[#FF6B8B]/20 bg-[#FF6B8B]/10 p-4">
                  <p className="text-sm font-semibold text-[#FF829D]">
                    Alasan Penolakan
                  </p>

                  <p className="mt-2 text-sm text-gray-300">
                    {selectedTransaction.alasan_penolakan}
                  </p>
                </div>
              )}

              {/* NOTES */}
              {selectedTransaction.catatan && (
                <div>
                  <p className="text-sm text-gray-400">
                    Catatan
                  </p>

                  <p className="mt-2 text-sm text-gray-300">
                    {selectedTransaction.catatan}
                  </p>
                </div>
              )}

              {/* FINE SUMMARY */}
              <div className="rounded-xl border border-white/10 bg-[#211C45] p-5">
                <p className="text-sm text-gray-400">
                  Rekapitulasi Denda
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-400">
                      Total denda
                    </span>

                    <span className="font-semibold">
                      {formatRupiah(selectedTransaction.total_denda)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-400">
                      Belum dibayar
                    </span>

                    <span className="text-[#F5B544]">
                      {formatRupiah(
                        selectedTransaction.denda_belum_dibayar
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-400">
                      Lunas
                    </span>

                    <span className="text-[#2BB5A0]">
                      {formatRupiah(selectedTransaction.denda_lunas)}
                    </span>
                  </div>
                </div>
              </div>

              {/* STAFF */}
              <div>
                <p className="text-sm text-gray-400">
                  Petugas Pemroses
                </p>

                <p className="mt-2 font-medium">
                  {selectedTransaction.nama_petugas || "Belum diproses"}
                </p>
              </div>

              {/* EXTENSION */}
              <div>
                <p className="text-sm text-gray-400">
                  Riwayat Perpanjangan
                </p>

                <p className="mt-2 font-medium">
                  {selectedTransaction.jumlah_pengajuan_perpanjangan} pengajuan
                </p>

                {selectedTransaction.status_perpanjangan && (
                  <p className="mt-1 text-sm text-gray-400">
                    Status terakhir: {selectedTransaction.status_perpanjangan}
                  </p>
                )}
              </div>

            </div>
          </aside>
        </div>
      )}

    </div>
  );
}