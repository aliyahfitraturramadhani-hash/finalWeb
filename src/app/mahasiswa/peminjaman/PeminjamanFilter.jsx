"use client";

import { useMemo, useState } from "react";
import PengajuanPerpanjangan from "./PengajuanPerpanjangan";

// =========================================
// STATUS
// =========================================

const statusOptions = [
  { value: "semua", label: "Semua Status" },
  { value: "menunggu_konfirmasi", label: "Menunggu Konfirmasi" },
  { value: "sedang_dipinjam", label: "Sedang Dipinjam" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
];

// =========================================
// FILTER COMPONENT
// =========================================

export default function PeminjamanFilter({ peminjaman }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");

  // =========================================
  // SEARCH & FILTER
  // =========================================

  const filteredPeminjaman = useMemo(() => {
    return peminjaman.filter((item) => {
      const matchStatus =
        statusFilter === "semua" ||
        item.status === statusFilter;

      const keyword = search.toLowerCase().trim();

      const matchSearch =
        !keyword ||
        item.kode_pinjam?.toLowerCase().includes(keyword) ||
        item.buku?.some(
          (buku) =>
            buku.judul?.toLowerCase().includes(keyword) ||
            buku.penulis?.toLowerCase().includes(keyword)
        );

      return matchStatus && matchSearch;
    });
  }, [peminjaman, search, statusFilter]);

  // =========================================
  // STATUS LABEL
  // =========================================

  function getStatus(status) {
    const statusMap = {
      menunggu_konfirmasi: {
        label: "Menunggu Konfirmasi",
        color: "bg-amber-500/20 text-amber-400",
      },

      sedang_dipinjam: {
        label: "Sedang Dipinjam",
        color: "bg-blue-500/20 text-blue-400",
      },

      selesai: {
        label: "Selesai",
        color: "bg-teal-500/20 text-teal-400",
      },

      ditolak: {
        label: "Ditolak",
        color: "bg-rose-500/20 text-rose-400",
      },
    };

    return (
      statusMap[status] || {
        label: status,
        color: "bg-gray-500/20 text-gray-400",
      }
    );
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="space-y-5">

      {/* SEARCH & FILTER */}

      <div className="flex flex-col gap-3 md:flex-row">

        {/* SEARCH */}

        <div className="relative flex-1">

          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6A1BC]">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Cari kode peminjaman, judul, atau penulis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-[#211D39] py-3 pl-11 pr-4 text-sm text-[#F5F0E8] outline-none transition placeholder:text-[#827A9B] focus:border-[#FFB82E]/50 focus:ring-1 focus:ring-[#FFB82E]/20"
          />

        </div>

        {/* FILTER STATUS */}

        <div className="relative">

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-[#211D39] px-4 py-3 pr-10 text-sm text-[#F5F0E8] outline-none transition focus:border-[#FFB82E]/50 md:min-w-[220px]"
          >

            {statusOptions.map((option) => (

              <option
                key={option.value}
                value={option.value}
                className="bg-[#211D39] text-[#F5F0E8]"
              >
                {option.label}
              </option>

            ))}

          </select>

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#A6A1BC]">
            ▾
          </span>

        </div>

      </div>

      {/* HASIL FILTER */}

      <p className="text-xs text-[#827A9B]">
        Menampilkan {filteredPeminjaman.length} dari {peminjaman.length} transaksi
      </p>

      {/* EMPTY RESULT */}

      {filteredPeminjaman.length === 0 ? (

        <div className="rounded-2xl border border-white/5 bg-[#211D39] p-10 text-center">

          <div className="mb-4 text-4xl">
            🔍
          </div>

          <h3 className="font-semibold text-[#F5F0E8]">
            Peminjaman Tidak Ditemukan
          </h3>

          <p className="mt-2 text-sm text-[#A6A1BC]">
            Tidak ada transaksi yang sesuai dengan pencarian atau filter kamu.
          </p>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("semua");
            }}
            className="mt-5 rounded-full border border-[#FFB82E]/30 px-5 py-2 text-sm font-semibold text-[#FFB82E] transition hover:bg-[#FFB82E]/10"
          >
            Reset Filter
          </button>

        </div>

      ) : (

        /* DAFTAR TRANSAKSI */

        <div className="space-y-5">

          {filteredPeminjaman.map((item) => {

            const status = getStatus(item.status);

            const sudahPerpanjang =
              Number(item.jumlah_perpanjangan || 0) >= 1;

            const pengajuanPending =
              item.pengajuan_perpanjangan_pending === true ||
              item.extension_request_pending === true;

            const bolehAjukan =
              item.status === "sedang_dipinjam" &&
              !sudahPerpanjang &&
              !pengajuanPending &&
              Boolean(item.jatuh_tempo);

            return (

              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/5 bg-[#211D39] transition hover:bg-[#292443]"
              >

                {/* HEADER */}

                <div className="flex flex-col gap-4 border-b border-white/10 bg-[#292443] p-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wider text-[#A6A1BC]">
                      Kode Peminjaman
                    </p>

                    <h3 className="mt-1 font-semibold text-[#FFB82E]">
                      {item.kode_pinjam}
                    </h3>

                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${status.color}`}
                  >
                    {status.label}
                  </span>

                </div>

                {/* INFORMASI TRANSAKSI */}

                <div className="p-5">

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                    <InfoItem
                      label="Tanggal Peminjaman"
                      value={formatTanggal(item.tanggal_pinjam)}
                    />

                    <InfoItem
                      label="Batas Pengambilan"
                      value={formatTanggal(item.batas_ambil)}
                    />

                    <InfoItem
                      label="Jatuh Tempo"
                      value={formatTanggal(item.jatuh_tempo)}
                    />

                  </div>

                  {/* INDIKATOR KETERLAMBATAN */}

                  {item.status === "sedang_dipinjam" &&
                    item.jatuh_tempo && (

                      <DeadlineIndicator
                        tanggal={item.jatuh_tempo}
                      />

                    )}

                  {/* FITUR PERPANJANGAN */}

                  {item.status === "sedang_dipinjam" && (

                    <div className="mt-5 rounded-xl border border-[#FFB82E]/10 bg-[#292443] p-4">

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <p className="font-semibold text-[#F5F0E8]">
                            Perpanjangan Peminjaman
                          </p>

                          <p className="mt-1 text-xs text-[#A6A1BC]">
                            Maksimal satu kali perpanjangan untuk setiap transaksi.
                          </p>

                        </div>

                        <div className="shrink-0">

                          {sudahPerpanjang ? (

                            <span className="inline-flex rounded-full bg-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-400">
                              Perpanjangan Digunakan
                            </span>

                          ) : pengajuanPending ? (

                            <span className="inline-flex rounded-full bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
                              Menunggu Keputusan
                            </span>

                          ) : bolehAjukan ? (

                            <PengajuanPerpanjangan
                              loan={{
                                id: item.id,
                                kode_pinjam: item.kode_pinjam,
                                jatuh_tempo: item.jatuh_tempo,
                              }}
                              onSuccess={() => {
                                window.location.reload();
                              }}
                            />

                          ) : (

                            <span className="inline-flex rounded-full bg-gray-500/10 px-4 py-2 text-xs font-semibold text-gray-400">
                              Tidak Tersedia
                            </span>

                          )}

                        </div>

                      </div>

                    </div>

                  )}

                  {/* ALASAN PENOLAKAN */}

                  {item.status === "ditolak" &&
                    item.alasan_penolakan && (

                      <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">

                        <p className="text-sm font-semibold text-rose-400">
                          Alasan Penolakan
                        </p>

                        <p className="mt-2 text-sm text-[#D6D1E5]">
                          {item.alasan_penolakan}
                        </p>

                      </div>

                    )}

                  {/* DAFTAR BUKU */}

                  <div className="mt-6">

                    <h4 className="mb-4 font-semibold text-[#F5F0E8]">
                      Buku dalam Transaksi ({item.buku.length})
                    </h4>

                    <div className="space-y-4">

                      {item.buku.map((buku) => (

                        <div
                          key={buku.loan_item_id}
                          className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[#292443] p-4 sm:flex-row"
                        >

                          {/* COVER */}

                          <div className="shrink-0">

                            {buku.sampul ? (

                              <img
                                src={buku.sampul}
                                alt={buku.judul}
                                className="h-36 w-24 rounded-lg object-cover shadow-md"
                              />

                            ) : (

                              <div className="flex h-36 w-24 items-center justify-center rounded-lg bg-[#211D39] text-3xl">
                                📖
                              </div>

                            )}

                          </div>

                          {/* DETAIL BUKU */}

                          <div className="flex-1">

                            <h5 className="font-semibold text-[#F5F0E8]">
                              {buku.judul}
                            </h5>

                            <p className="mt-1 text-sm text-[#A6A1BC]">
                              {buku.penulis || "Penulis tidak diketahui"}
                            </p>

                            {buku.penerbit && (

                              <p className="mt-1 text-xs text-[#827A9B]">
                                {buku.penerbit}

                                {buku.tahun_terbit
                                  ? ` • ${buku.tahun_terbit}`
                                  : ""}
                              </p>

                            )}

                            <div className="mt-4 space-y-2 text-sm">

                              <p>

                                <span className="text-[#A6A1BC]">
                                  Kode Eksemplar:
                                </span>{" "}

                                <span className="font-medium text-[#D6D1E5]">
                                  {buku.kode_eksemplar || "-"}
                                </span>

                              </p>

                              <p>

                                <span className="text-[#A6A1BC]">
                                  Lokasi Rak:
                                </span>{" "}

                                <span className="font-medium text-[#D6D1E5]">
                                  {buku.lokasi_rak || "-"}
                                </span>

                              </p>

                              {buku.tanggal_kembali && (

                                <p>

                                  <span className="text-[#A6A1BC]">
                                    Tanggal Kembali:
                                  </span>{" "}

                                  <span className="font-medium text-[#D6D1E5]">
                                    {formatTanggal(
                                      buku.tanggal_kembali
                                    )}
                                  </span>

                                </p>

                              )}

                            </div>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}

    </div>

  );

}

// =========================================
// INDIKATOR JATUH TEMPO
// =========================================

function DeadlineIndicator({ tanggal }) {

  const info = getDeadlineInfo(tanggal);

  if (!info) return null;

  return (

    <div
      className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${info.containerStyle}`}
    >

      <div className="text-xl">
        {info.icon}
      </div>

      <div>

        <p className={`text-sm font-semibold ${info.textStyle}`}>
          {info.text}
        </p>

        <p className="mt-1 text-xs text-[#A6A1BC]">
          {info.description}
        </p>

      </div>

    </div>

  );

}

// =========================================
// PERHITUNGAN DEADLINE
// =========================================

function getDeadlineInfo(tanggal) {

  const todayString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
  }).format(new Date());

  const dueString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
  }).format(new Date(tanggal));

  const today = new Date(`${todayString}T00:00:00`);
  const dueDate = new Date(`${dueString}T00:00:00`);

  const diff = Math.round(
    (dueDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diff < 0) {

    const terlambat = Math.abs(diff);

    return {
      text: `Terlambat ${terlambat} hari`,
      description:
        "Segera hubungi petugas perpustakaan untuk informasi pengembalian.",
      icon: "⚠️",
      containerStyle: "border-rose-500/20 bg-rose-500/10",
      textStyle: "text-rose-400",
    };

  }

  if (diff === 0) {

    return {
      text: "Jatuh tempo hari ini",
      description: "Jangan lupa mengembalikan buku hari ini.",
      icon: "⏰",
      containerStyle: "border-amber-500/20 bg-amber-500/10",
      textStyle: "text-amber-400",
    };

  }

  if (diff <= 2) {

    return {
      text: `H-${diff}`,
      description:
        "Jatuh tempo semakin dekat. Persiapkan pengembalian buku.",
      icon: "⏰",
      containerStyle: "border-amber-500/20 bg-amber-500/10",
      textStyle: "text-amber-400",
    };

  }

  return {
    text: `H-${diff}`,
    description: "Buku masih dalam masa peminjaman.",
    icon: "📅",
    containerStyle: "border-white/5 bg-[#211D39]",
    textStyle: "text-[#A6A1BC]",
  };

}

// =========================================
// FORMAT TANGGAL
// =========================================

function formatTanggal(tanggal) {

  if (!tanggal) return "-";

  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });

}

// =========================================
// KOMPONEN INFORMASI
// =========================================

function InfoItem({ label, value }) {

  return (

    <div className="rounded-xl border border-white/5 bg-[#292443] p-4">

      <p className="text-xs font-medium text-[#A6A1BC]">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-[#F5F0E8]">
        {value}
      </p>

    </div>

  );

}