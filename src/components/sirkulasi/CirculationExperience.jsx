"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getCirculationData,
} from "@/app/actions/pegawai-sirkulasi";
import {
  processReturn,
} from "@/app/actions/pegawai-pengembalian";

const FILTERS = [
  { label: "Semua", value: "semua" },
  { label: "Sedang Dipinjam", value: "aktif" },
  { label: "Terlambat", value: "terlambat" },
  { label: "Selesai", value: "selesai" },
];

export default function CirculationExperience({
  role = "pegawai",
}) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    aktif: 0,
    terlambat: 0,
    selesai: 0,
  });

  const [filter, setFilter] = useState("semua");

  const [loading, setLoading] = useState(true);
  const [searchPending, startSearchTransition] = useTransition();
  const [returnPending, startReturnTransition] =
    useTransition();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedItem, setSelectedItem] = useState(null);
  const [kondisiKembali, setKondisiKembali] =
    useState("baik");

  async function loadData(search = "") {
    try {
      const data = await getCirculationData(search);

      setResults(data.items || []);
      setSummary(data.summary || {
        total: 0,
        aktif: 0,
        terlambat: 0,
        selesai: 0,
      });
    } catch (err) {
      setError(
        err.message || "Gagal mengambil data sirkulasi."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleSearch(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    startSearchTransition(async () => {
      await loadData(keyword);
    });
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getStatus(item) {
    if (item.status === "selesai") {
      return "selesai";
    }

    if (Number(item.hari_terlambat) > 0) {
      return "terlambat";
    }

    return "aktif";
  }

  function getStatusLabel(item) {
    const status = getStatus(item);

    if (status === "selesai") {
      return "Selesai";
    }

    if (status === "terlambat") {
      return "Terlambat";
    }

    return "Sedang Dipinjam";
  }

  function getStatusClass(item) {
    const status = getStatus(item);

    if (status === "selesai") {
      return "bg-white/10 text-gray-300";
    }

    if (status === "terlambat") {
      return "bg-[#FF6B8B]/10 text-[#FF6B8B]";
    }

    return "bg-[#2CC6A5]/10 text-[#2CC6A5]";
  }

  const filteredResults = results.filter((item) => {
    if (filter === "semua") return true;

    return getStatus(item) === filter;
  });

  function openReturn(item) {
    setSelectedItem(item);
    setKondisiKembali("baik");
    setError("");
    setSuccess("");
  }

  function confirmReturn() {
    if (!selectedItem) return;

    setError("");
    setSuccess("");

    startReturnTransition(async () => {
      try {
        const result = await processReturn(
          selectedItem.loan_item_id,
          kondisiKembali
        );

        if (!result?.success) {
          throw new Error(
            "Pengembalian gagal diproses."
          );
        }

        setSelectedItem(null);

        setLoading(true);

        await loadData(keyword);

        let message =
          "Pengembalian buku berhasil diproses.";

        if (result.hari_terlambat > 0) {
          message +=
            ` Buku terlambat ${result.hari_terlambat} hari.`;
        }

        setSuccess(message);
      } catch (err) {
        setError(
          err.message ||
          "Gagal memproses pengembalian."
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#14112B] text-[#F5F0E8]">

      {/* HEADER */}
      <header className="border-b border-white/10 px-6 py-8 md:px-10">

        <p
          className={`text-xs font-bold tracking-widest ${
            role === "admin"
              ? "text-[#FF6B8B]"
              : "text-[#F5B544]"
          }`}
        >
          {role === "admin"
            ? "ADMIN / SIRKULASI"
            : "PEGAWAI / SIRKULASI"}
        </p>

        <h1 className="mt-3 text-3xl font-bold md:text-4xl">
          Meja Sirkulasi
        </h1>

        <p className="mt-3 text-sm text-[#A6A0C0]">
          Pantau transaksi peminjaman dan proses
          pengembalian buku perpustakaan.
        </p>

      </header>

      <section className="space-y-8 p-6 md:p-10">

        {/* STATISTICS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Transaksi"
            value={summary.total}
            color="#F5B544"
            icon="▤"
          />

          <StatCard
            title="Sedang Dipinjam"
            value={summary.aktif}
            color="#2CC6A5"
            icon="↗"
          />

          <StatCard
            title="Terlambat"
            value={summary.terlambat}
            color="#FF6B8B"
            icon="!"
          />

          <StatCard
            title="Selesai"
            value={summary.selesai}
            color="#4DA3FF"
            icon="✓"
          />

        </section>

        {/* SEARCH */}
        <section className="rounded-2xl border border-white/10 bg-[#211C45] p-6">

          <h2 className="text-xl font-bold">
            Cari Peminjaman
          </h2>

          <p className="mt-2 text-sm text-[#A6A0C0]">
            Cari berdasarkan nomor anggota, nama,
            judul buku, penulis, atau kode eksemplar.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex flex-col gap-3 md:flex-row"
          >

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari NIM, nama, judul buku..."
              className="flex-1 rounded-xl border border-white/10 bg-[#14112B] px-5 py-4 text-white outline-none transition placeholder:text-[#77718F] focus:border-[#F5B544]"
            />

            <button
              type="submit"
              disabled={searchPending}
              className="rounded-xl bg-[#F5B544] px-8 py-4 font-bold text-[#14112B] transition hover:bg-[#FFC95C] disabled:opacity-50"
            >
              {searchPending
                ? "Mencari..."
                : "Cari"}
            </button>

          </form>

          <button
            type="button"
            onClick={() => {
              setKeyword("");
              setFilter("semua");
              setError("");
              setSuccess("");
              setLoading(true);

              startSearchTransition(async () => {
                await loadData("");
              });
            }}
            className="mt-4 text-sm text-[#A6A0C0] transition hover:text-[#F5B544]"
          >
            ↻ Tampilkan semua data
          </button>

          {error && (
            <div className="mt-4 rounded-xl bg-[#FF6B8B]/10 p-4 text-sm text-[#FF6B8B]">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl bg-[#2CC6A5]/10 p-4 text-sm text-[#2CC6A5]">
              {success}
            </div>
          )}

        </section>

        {/* TABLE SECTION */}
        <section>

          {/* FILTER */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Data Transaksi
              </h2>

              <p className="mt-2 text-sm text-[#A6A0C0]">
                Daftar transaksi peminjaman buku.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filter === item.value
                      ? "bg-[#F5B544] text-[#14112B]"
                      : "border border-white/10 bg-[#211C45] text-[#A6A0C0] hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}

            </div>

          </div>

          {/* TABLE */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#211C45]">

            {loading ? (
              <div className="p-12 text-center text-[#A6A0C0]">
                Memuat data transaksi...
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="p-12 text-center text-[#A6A0C0]">
                Tidak ada data transaksi yang ditemukan.
              </div>
            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1100px] text-left">

                  <thead className="border-b border-white/10 bg-[#14112B]/50">

                    <tr>
                      <Th>Mahasiswa</Th>
                      <Th>Buku</Th>
                      <Th>Pinjam</Th>
                      <Th>Jatuh Tempo</Th>
                      <Th>Status</Th>
                      <Th>Aksi</Th>
                    </tr>

                  </thead>

                  <tbody>

                    {filteredResults.map((item) => {

                      const overdue =
                        Number(item.hari_terlambat) > 0;

                      return (

                        <tr
                          key={item.loan_item_id}
                          className="border-b border-white/5 transition hover:bg-white/[0.03]"
                        >

                          {/* MEMBER */}
                          <td className="px-5 py-5">

                            <p className="font-semibold">
                              {item.nama_mahasiswa}
                            </p>

                            <p className="mt-1 text-xs text-[#A6A0C0]">
                              {item.nomor_anggota}
                            </p>

                          </td>

                          {/* BOOK */}
                          <td className="px-5 py-5">

                            <p className="max-w-[250px] font-semibold">
                              {item.judul}
                            </p>

                            <p className="mt-1 text-sm text-[#A6A0C0]">
                              {item.penulis}
                            </p>

                            <p className="mt-2 text-xs text-[#77718F]">
                              {item.kode_eksemplar}
                            </p>

                          </td>

                          {/* BORROW DATE */}
                          <td className="px-5 py-5 text-sm">
                            {formatDate(item.tanggal_pinjam)}
                          </td>

                          {/* DUE DATE */}
                          <td className="px-5 py-5">

                            <p
                              className={`text-sm font-semibold ${
                                overdue
                                  ? "text-[#FF6B8B]"
                                  : "text-[#F5B544]"
                              }`}
                            >
                              {formatDate(item.jatuh_tempo)}
                            </p>

                            {overdue && (
                              <p className="mt-1 text-xs text-[#FF6B8B]">
                                {item.hari_terlambat} hari terlambat
                              </p>
                            )}

                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-5">

                            <span
                              className={`inline-flex rounded-full px-3 py-2 text-xs font-bold ${getStatusClass(item)}`}
                            >
                              {getStatusLabel(item)}
                            </span>

                          </td>

                          {/* ACTION */}
                          <td className="px-5 py-5">

                            {item.status === "sedang_dipinjam" ? (

                              <button
                                type="button"
                                onClick={() => openReturn(item)}
                                className="rounded-xl bg-[#F5B544] px-4 py-3 text-sm font-bold text-[#14112B] transition hover:bg-[#FFC95C]"
                              >
                                Kembalikan
                              </button>

                            ) : (

                              <span className="text-xs text-[#77718F]">
                                Selesai
                              </span>

                            )}

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            )}

          </div>

          <div className="mt-4 text-sm text-[#A6A0C0]">
            Menampilkan {filteredResults.length} transaksi.
          </div>

        </section>

      </section>

      {/* RETURN MODAL */}
      {selectedItem && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#14112B] p-6 shadow-2xl">

            <h2 className="text-xl font-bold">
              Konfirmasi Pengembalian
            </h2>

            <p className="mt-2 text-sm text-[#A6A0C0]">
              Pastikan buku telah diterima
              sebelum memproses pengembalian.
            </p>

            <div className="mt-5 rounded-xl bg-[#211C45] p-4">

              <p className="font-semibold">
                {selectedItem.judul}
              </p>

              <p className="mt-2 text-sm text-[#A6A0C0]">
                {selectedItem.nama_mahasiswa}
              </p>

              <p className="mt-2 text-xs text-[#77718F]">
                Eksemplar: {selectedItem.kode_eksemplar}
              </p>

            </div>

            <label className="mt-6 block text-sm font-semibold">
              Kondisi Buku
            </label>

            <select
              value={kondisiKembali}
              onChange={(e) =>
                setKondisiKembali(e.target.value)
              }
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#211C45] px-4 py-3 text-white outline-none focus:border-[#F5B544]"
            >

              <option value="baik">
                Baik
              </option>

              <option value="rusak">
                Rusak
              </option>

              <option value="hilang">
                Hilang
              </option>

            </select>

            {Number(selectedItem.hari_terlambat) > 0 && (

              <div className="mt-4 rounded-xl bg-[#FF6B8B]/10 p-4">

                <p className="font-bold text-[#FF6B8B]">
                  Terlambat {selectedItem.hari_terlambat} hari
                </p>

                <p className="mt-2 text-sm text-[#A6A0C0]">
                  Sistem akan menghitung denda
                  keterlambatan berdasarkan tarif buku.
                </p>

              </div>

            )}

            {kondisiKembali !== "baik" && (

              <div className="mt-4 rounded-xl bg-[#F5B544]/10 p-4">

                <p className="font-bold text-[#F5B544]">
                  Perhatian
                </p>

                <p className="mt-2 text-sm text-[#A6A0C0]">
                  Kondisi {kondisiKembali} akan dicatat
                  dan dapat menghasilkan denda tambahan.
                </p>

              </div>

            )}

            {error && (
              <div className="mt-4 rounded-xl bg-[#FF6B8B]/10 p-4 text-sm text-[#FF6B8B]">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                disabled={returnPending}
                className="flex-1 rounded-xl border border-white/10 px-5 py-3 font-semibold text-[#A6A0C0] transition hover:bg-white/5 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={confirmReturn}
                disabled={returnPending}
                className="flex-1 rounded-xl bg-[#F5B544] px-5 py-3 font-bold text-[#14112B] transition hover:bg-[#FFC95C] disabled:opacity-50"
              >
                {returnPending
                  ? "Memproses..."
                  : "Konfirmasi"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

function StatCard({
  title,
  value,
  color,
  icon,
}) {
  return (

    <div className="rounded-2xl border border-white/10 bg-[#211C45] p-6">

      <div className="flex items-start justify-between">

        <p className="text-sm text-[#A6A0C0]">
          {title}
        </p>

        <span
          style={{ color }}
          className="text-xl font-bold"
        >
          {icon}
        </span>

      </div>

      <p
        style={{ color }}
        className="mt-6 font-serif text-4xl font-bold"
      >
        {value}
      </p>

    </div>

  );
}

function Th({ children }) {
  return (
    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#A6A0C0]">
      {children}
    </th>
  );
}