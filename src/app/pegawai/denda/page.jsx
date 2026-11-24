"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getFines,
  payFine,
  waiveFine,
} from "@/app/actions/pegawai-denda";

export default function DendaPage() {
  const [fines, setFines] = useState([]);
  const [summaryFines, setSummaryFines] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");

  const [loading, startLoading] = useTransition();
  const [pending, startAction] = useTransition();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedFine, setSelectedFine] = useState(null);
  const [reason, setReason] = useState("");
  const [modalType, setModalType] = useState("");

  // LOAD LIST DATA
  async function loadFines(search = keyword, status = statusFilter) {
    startLoading(async () => {
      try {
        setError("");

        const data = await getFines(search, status);
        setFines(data || []);
      } catch (err) {
        setError(err.message || "Gagal mengambil data denda.");
      }
    });
  }

  // LOAD SUMMARY DATA
  async function loadSummary() {
    try {
      const data = await getFines("", "semua");
      setSummaryFines(data || []);
    } catch (err) {
      setError(err.message || "Gagal mengambil statistik denda.");
    }
  }

  // INITIAL LOAD
  useEffect(() => {
    startLoading(async () => {
      try {
        const [listData, summaryData] = await Promise.all([
          getFines("", "semua"),
          getFines("", "semua"),
        ]);

        setFines(listData || []);
        setSummaryFines(summaryData || []);
      } catch (err) {
        setError(err.message || "Gagal mengambil data denda.");
      }
    });
  }, []);

  // SEARCH
  function handleSearch(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    loadFines(keyword, statusFilter);
  }

  // FILTER STATUS
  function handleFilterChange(value) {
    setStatusFilter(value);
    setError("");
    setSuccess("");

    loadFines(keyword, value);
  }

  // FORMAT DATE
  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // FORMAT CURRENCY
  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  // OPEN PAY MODAL
  function openPayModal(fine) {
    setSelectedFine(fine);
    setModalType("pay");
    setReason("");
    setError("");
    setSuccess("");
  }

  // OPEN WAIVE MODAL
  function openWaiveModal(fine) {
    setSelectedFine(fine);
    setModalType("waive");
    setReason("");
    setError("");
    setSuccess("");
  }

  // CLOSE MODAL
  function closeModal() {
    if (pending) return;

    setSelectedFine(null);
    setModalType("");
    setReason("");
    setError("");
  }

  // CONFIRM ACTION
  function confirmAction() {
    if (!selectedFine) return;

    setError("");

    startAction(async () => {
      try {
        if (modalType === "pay") {
          await payFine(selectedFine.id);
        } else {
          await waiveFine(selectedFine.id, reason);
        }

        setSelectedFine(null);
        setModalType("");
        setReason("");

        // Refresh list and summary
        const [listData, summaryData] = await Promise.all([
          getFines(keyword, statusFilter),
          getFines("", "semua"),
        ]);

        setFines(listData || []);
        setSummaryFines(summaryData || []);

        setSuccess(
          modalType === "pay"
            ? "Pembayaran denda berhasil diproses."
            : "Denda berhasil dihapuskan."
        );
      } catch (err) {
        setError(err.message || "Terjadi kesalahan.");
      }
    });
  }

  // SUMMARY DATA FROM ALL FINES
  const unpaid = summaryFines.filter(
    (fine) => fine.status === "belum_dibayar"
  );

  const paid = summaryFines.filter(
    (fine) => fine.status === "lunas"
  );

  const waived = summaryFines.filter(
    (fine) => fine.status === "dihapuskan"
  );

  const totalUnpaid = unpaid.reduce(
    (total, fine) => total + Number(fine.jumlah_denda || 0),
    0
  );

  const totalPaid = paid.reduce(
    (total, fine) => total + Number(fine.jumlah_denda || 0),
    0
  );

  const totalWaived = waived.reduce(
    (total, fine) => total + Number(fine.jumlah_denda || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#14112B] text-[#F5F0E8]">
      <div className="mx-auto max-w-7xl overflow-hidden bg-[#14112B] text-[#F5F0E8]">

        {/* HEADER */}
        <header className="border-b border-white/10 px-6 py-8 md:px-10">
          <p className="text-xs font-bold tracking-widest text-[#F5B544]">
            PEGAWAI / KEUANGAN
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Pengelolaan Denda
          </h1>

          <p className="mt-3 text-sm text-[#A6A0C0]">
            Kelola pembayaran dan penghapusan denda anggota perpustakaan.
          </p>
        </header>

        <section className="p-6 md:p-10">

          {/* SUMMARY */}
          <div className="grid gap-4 md:grid-cols-3">

            {/* UNPAID */}
            <div className="rounded-2xl border border-white/10 bg-[#211C45] p-6">
              <p className="text-sm text-[#A6A0C0]">
                Denda Belum Dibayar
              </p>

              <h2 className="mt-3 text-2xl font-bold text-[#FF5C87]">
                {formatRupiah(totalUnpaid)}
              </h2>

              <p className="mt-2 text-sm text-[#77718F]">
                {unpaid.length} transaksi
              </p>
            </div>

            {/* PAID */}
            <div className="rounded-2xl border border-white/10 bg-[#211C45] p-6">
              <p className="text-sm text-[#A6A0C0]">
                Denda Lunas
              </p>

              <h2 className="mt-3 text-2xl font-bold text-[#2CC6A5]">
                {formatRupiah(totalPaid)}
              </h2>

              <p className="mt-2 text-sm text-[#77718F]">
                {paid.length} transaksi
              </p>
            </div>

            {/* WAIVED */}
            <div className="rounded-2xl border border-white/10 bg-[#211C45] p-6">
              <p className="text-sm text-[#A6A0C0]">
                Denda Dihapuskan
              </p>

              <h2 className="mt-3 text-2xl font-bold text-[#F5B544]">
                {formatRupiah(totalWaived)}
              </h2>

              <p className="mt-2 text-sm text-[#77718F]">
                {waived.length} transaksi
              </p>
            </div>

          </div>

          {/* SEARCH & FILTER */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#211C45] p-6">

            <h2 className="text-xl font-bold">
              Cari Denda
            </h2>

            <p className="mt-2 text-sm text-[#A6A0C0]">
              Cari berdasarkan nomor anggota, nama, email, judul buku,
              atau kode peminjaman.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-5 flex flex-col gap-3"
            >

              <div className="flex flex-col gap-3 md:flex-row">

                {/* SEARCH INPUT */}
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Masukkan kata kunci..."
                  className="flex-1 rounded-xl border border-white/10 bg-[#14112B] px-5 py-4 outline-none transition placeholder:text-[#77718F] focus:border-[#F5B544]"
                />

                {/* SEARCH BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-[#F5B544] px-8 py-4 font-bold text-[#14112B] transition hover:bg-[#FFC95C] disabled:opacity-50"
                >
                  {loading ? "Mencari..." : "Cari"}
                </button>

              </div>

              {/* STATUS FILTER */}
              <div className="flex flex-col gap-2 md:flex-row md:items-center">

                <label
                  htmlFor="statusFilter"
                  className="text-sm font-semibold text-[#A6A0C0]"
                >
                  Filter Status:
                </label>

                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-[#14112B] px-5 py-3 text-white outline-none transition focus:border-[#F5B544]"
                >
                  <option value="semua">Semua Status</option>
                  <option value="belum_dibayar">Belum Dibayar</option>
                  <option value="lunas">Lunas</option>
                  <option value="dihapuskan">Dihapuskan</option>
                </select>

              </div>

            </form>

          </div>

          {/* ERROR */}
          {error && !selectedFine && (
            <div className="mt-5 rounded-xl bg-[#FF5C87]/10 p-4 text-[#FF5C87]">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mt-5 rounded-xl bg-[#2CC6A5]/10 p-4 text-[#2CC6A5]">
              {success}
            </div>
          )}

          {/* FINES LIST */}
          <div className="mt-8">

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <h2 className="text-xl font-bold">
                Daftar Denda
              </h2>

              <span className="w-fit rounded-full bg-[#F5B544]/15 px-4 py-2 text-sm font-bold text-[#F5B544]">
                {fines.length} Data
              </span>

            </div>

            {/* LOADING */}
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-[#211C45]/50 p-12 text-center text-[#A6A0C0]">
                Memuat data...
              </div>
            ) : fines.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#211C45]/50 p-12 text-center text-[#A6A0C0]">
                Belum ada data denda.
              </div>
            ) : (

              <div className="space-y-4">

                {fines.map((fine) => (

                  <article
                    key={fine.id}
                    className="rounded-2xl border border-white/10 bg-[#211C45]/60 p-6"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">

                      {/* INFORMATION */}
                      <div className="space-y-4">

                        {/* MEMBER */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#A6A0C0]">
                            Mahasiswa
                          </p>

                          <h3 className="mt-1 text-lg font-bold">
                            {fine.nama_mahasiswa}
                          </h3>

                          <p className="text-sm text-[#A6A0C0]">
                            {fine.nomor_anggota}
                          </p>

                          {fine.email && (
                            <p className="mt-1 text-sm text-[#77718F]">
                              {fine.email}
                            </p>
                          )}
                        </div>

                        {/* BOOK */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#A6A0C0]">
                            Buku
                          </p>

                          <h3 className="mt-1 font-semibold">
                            {fine.judul}
                          </h3>

                          <p className="mt-1 text-xs text-[#77718F]">
                            Eksemplar: {fine.kode_eksemplar}
                          </p>
                        </div>

                        {/* LOAN CODE */}
                        <div>
                          <p className="text-xs text-[#A6A0C0]">
                            Kode Peminjaman
                          </p>

                          <p className="mt-1 font-semibold">
                            {fine.kode_pinjam}
                          </p>
                        </div>

                      </div>

                      {/* FINE INFORMATION */}
                      <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">

                        {/* TYPE */}
                        <div className="rounded-xl bg-[#14112B] p-4">
                          <p className="text-xs text-[#A6A0C0]">
                            Jenis Denda
                          </p>

                          <p className="mt-2 font-semibold capitalize">
                            {fine.jenis}
                          </p>
                        </div>

                        {/* AMOUNT */}
                        <div className="rounded-xl bg-[#14112B] p-4">
                          <p className="text-xs text-[#A6A0C0]">
                            Nominal
                          </p>

                          <p className="mt-2 font-bold text-[#F5B544]">
                            {formatRupiah(fine.jumlah_denda)}
                          </p>
                        </div>

                        {/* DATE */}
                        <div className="rounded-xl bg-[#14112B] p-4">
                          <p className="text-xs text-[#A6A0C0]">
                            Tanggal
                          </p>

                          <p className="mt-2 text-sm font-semibold">
                            {formatDate(fine.created_at)}
                          </p>
                        </div>

                        {/* STATUS */}
                        <div className="rounded-xl bg-[#14112B] p-4">
                          <p className="text-xs text-[#A6A0C0]">
                            Status
                          </p>

                          <span
                            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                              fine.status === "belum_dibayar"
                                ? "bg-[#FF5C87]/10 text-[#FF5C87]"
                                : fine.status === "lunas"
                                  ? "bg-[#2CC6A5]/10 text-[#2CC6A5]"
                                  : "bg-[#F5B544]/10 text-[#F5B544]"
                            }`}
                          >
                            {fine.status.replaceAll("_", " ")}
                          </span>
                        </div>

                        {/* LATE DAYS */}
                        {fine.jenis === "terlambat" && (
                          <div className="col-span-2 rounded-xl bg-[#14112B] p-4">
                            <p className="text-xs text-[#A6A0C0]">
                              Hari Terlambat
                            </p>

                            <p className="mt-2 font-semibold">
                              {fine.hari_terlambat} hari
                            </p>
                          </div>
                        )}

                      </div>

                    </div>

                    {/* WAIVER REASON */}
                    {fine.status === "dihapuskan" &&
                      fine.alasan_penghapusan && (
                        <div className="mt-5 rounded-xl bg-[#F5B544]/10 p-4">
                          <p className="text-xs font-bold text-[#F5B544]">
                            Alasan Penghapusan
                          </p>

                          <p className="mt-2 text-sm text-[#A6A0C0]">
                            {fine.alasan_penghapusan}
                          </p>
                        </div>
                      )}

                    {/* ACTIONS */}
                    {fine.status === "belum_dibayar" && (
                      <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">

                        {/* PAY */}
                        <button
                          type="button"
                          onClick={() => openPayModal(fine)}
                          className="rounded-xl bg-[#2CC6A5] px-5 py-3 font-bold text-[#14112B] transition hover:bg-[#45D9B9]"
                        >
                          Bayar Denda
                        </button>

                        {/* WAIVE */}
                        <button
                          type="button"
                          onClick={() => openWaiveModal(fine)}
                          className="rounded-xl border border-[#FF5C87]/30 bg-[#FF5C87]/10 px-5 py-3 font-bold text-[#FF5C87] transition hover:bg-[#FF5C87]/20"
                        >
                          Hapuskan Denda
                        </button>

                      </div>
                    )}

                  </article>

                ))}

              </div>

            )}

          </div>

        </section>
      </div>

      {/* MODAL */}
      {selectedFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#14112B] p-6 text-[#F5F0E8] shadow-2xl md:p-8">

            {/* MODAL HEADER */}
            <p className="text-xs font-bold tracking-widest text-[#F5B544]">
              {modalType === "pay"
                ? "KONFIRMASI PEMBAYARAN"
                : "PENGHAPUSAN DENDA"}
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              {modalType === "pay"
                ? "Bayar Denda"
                : "Hapuskan Denda"}
            </h2>

            {/* FINE DETAILS */}
            <div className="mt-5 rounded-xl bg-[#211C45] p-4">

              <p className="font-semibold">
                {selectedFine.nama_mahasiswa}
              </p>

              <p className="mt-1 text-sm text-[#A6A0C0]">
                {selectedFine.judul}
              </p>

              <p className="mt-3 text-xl font-bold text-[#F5B544]">
                {formatRupiah(selectedFine.jumlah_denda)}
              </p>

            </div>

            {/* WAIVE REASON */}
            {modalType === "waive" && (
              <>
                <label className="mt-6 block text-sm font-semibold">
                  Alasan Penghapusan
                </label>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Masukkan alasan penghapusan denda..."
                  className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-[#211C45] px-4 py-3 text-white outline-none transition placeholder:text-[#77718F] focus:border-[#F5B544]"
                />
              </>
            )}

            {/* PAYMENT MESSAGE */}
            {modalType === "pay" && (
              <p className="mt-5 text-sm text-[#A6A0C0]">
                Pastikan pembayaran telah diterima sebelum
                mengonfirmasi transaksi ini.
              </p>
            )}

            {/* MODAL ERROR */}
            {error && (
              <p className="mt-4 rounded-xl bg-[#FF5C87]/10 p-4 text-sm text-[#FF5C87]">
                {error}
              </p>
            )}

            {/* BUTTONS */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              {/* CANCEL */}
              <button
                type="button"
                onClick={closeModal}
                disabled={pending}
                className="flex-1 rounded-xl border border-white/10 px-5 py-3 font-semibold text-[#A6A0C0] transition hover:bg-white/5 disabled:opacity-50"
              >
                Batal
              </button>

              {/* CONFIRM */}
              <button
                type="button"
                onClick={confirmAction}
                disabled={
                  pending ||
                  (modalType === "waive" && !reason.trim())
                }
                className={`flex-1 rounded-xl px-5 py-3 font-bold text-[#14112B] transition disabled:opacity-50 ${
                  modalType === "pay"
                    ? "bg-[#2CC6A5] hover:bg-[#45D9B9]"
                    : "bg-[#F5B544] hover:bg-[#FFC95C]"
                }`}
              >
                {pending
                  ? "Memproses..."
                  : modalType === "pay"
                    ? "Konfirmasi Pembayaran"
                    : "Konfirmasi Penghapusan"}
              </button>

            </div>

          </div>

        </div>
      )}
    </main>
  );
}
