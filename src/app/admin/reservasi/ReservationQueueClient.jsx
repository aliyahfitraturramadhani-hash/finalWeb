"use client";

import { useState } from "react";

import {
  markReservationReady,
  cancelAdminReservation,
  completeReservation,
} from "@/app/actions/admin-reservasi";

const statusConfig = {
  menunggu: {
    label: "Menunggu",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },

  siap_diambil: {
    label: "Siap Diambil",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },

  selesai: {
    label: "Selesai",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },

  dibatalkan: {
    label: "Dibatalkan",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },

  kedaluwarsa: {
    label: "Kedaluwarsa",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
};

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ReservationQueueClient({
  reservations = [],
}) {
  const [data, setData] = useState(reservations);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [filter, setFilter] = useState("semua");

  async function handleAction(id, action) {
    setLoadingId(id);
    setMessage("");
    setMessageType("");

    try {
      let result;

      if (action === "ready") {
        result = await markReservationReady(id);

        setData((previous) =>
          previous.map((reservation) =>
            reservation.id === id
              ? {
                  ...reservation,
                  status: "siap_diambil",
                  ready_at: new Date().toISOString(),
                }
              : reservation
          )
        );
      }

      if (action === "cancel") {
        const confirmed = window.confirm(
          "Apakah kamu yakin ingin membatalkan reservasi ini?"
        );

        if (!confirmed) return;

        result = await cancelAdminReservation(id);

        setData((previous) =>
          previous.map((reservation) =>
            reservation.id === id
              ? {
                  ...reservation,
                  status: "dibatalkan",
                  cancelled_at: new Date().toISOString(),
                }
              : reservation
          )
        );
      }

      if (action === "complete") {
        const confirmed = window.confirm(
          "Tandai reservasi ini sebagai selesai?"
        );

        if (!confirmed) return;

        result = await completeReservation(id);

        setData((previous) =>
          previous.map((reservation) =>
            reservation.id === id
              ? {
                  ...reservation,
                  status: "selesai",
                  completed_at: new Date().toISOString(),
                }
              : reservation
          )
        );
      }

      if (result) {
        setMessage(result.message);
        setMessageType("success");
      }
    } catch (error) {
      setMessage(error.message || "Terjadi kesalahan.");
      setMessageType("error");
    } finally {
      setLoadingId(null);
    }
  }

  const filteredData =
    filter === "semua"
      ? data
      : data.filter((item) => item.status === filter);

  const waitingCount = data.filter(
    (item) => item.status === "menunggu"
  ).length;

  const readyCount = data.filter(
    (item) => item.status === "siap_diambil"
  ).length;

  const completedCount = data.filter(
    (item) => item.status === "selesai"
  ).length;

  return (
    <div className="min-h-screen bg-[#14112B] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#8B83A8]">
            Administrator / Manajemen
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Antrean Reservasi
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Kelola reservasi buku mahasiswa, urutan antrean,
            dan proses pengambilan buku.
          </p>
        </div>

        {/* STATISTICS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Total Reservasi"
            value={data.length}
            color="text-white"
          />

          <StatCard
            label="Menunggu"
            value={waitingCount}
            color="text-yellow-400"
          />

          <StatCard
            label="Siap Diambil"
            value={readyCount}
            color="text-green-400"
          />

          <StatCard
            label="Selesai"
            value={completedCount}
            color="text-blue-400"
          />

        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-green-500/20 bg-green-500/10 text-green-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* FILTER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-xl font-semibold">
              Daftar Reservasi
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              {filteredData.length} data ditampilkan
            </p>
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#211C45] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B8B]"
          >
            <option value="semua">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="siap_diambil">Siap Diambil</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
            <option value="kedaluwarsa">Kedaluwarsa</option>
          </select>

        </div>

        {/* EMPTY STATE */}
        {filteredData.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#211C45] p-12 text-center">
            <div className="mb-4 text-5xl">
              📚
            </div>

            <h3 className="text-xl font-semibold">
              Tidak Ada Reservasi
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Belum ada data reservasi pada kategori ini.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {filteredData.map((reservation) => {
              const status =
                statusConfig[reservation.status] ||
                statusConfig.menunggu;

              const isLoading =
                loadingId === reservation.id;

              return (
                <div
                  key={reservation.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#211C45]"
                >

                  {/* CARD HEADER */}
                  <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">

                    <div>
                      <p className="text-xs text-gray-400">
                        Reservasi #{reservation.id}
                      </p>

                      <h3 className="mt-1 text-lg font-bold">
                        {reservation.judul}
                      </h3>

                      <p className="mt-1 text-sm text-gray-400">
                        {reservation.penulis || "Penulis tidak diketahui"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${status.color}`}
                    >
                      {status.label}
                    </span>

                  </div>

                  {/* CARD BODY */}
                  <div className="p-5">

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-[120px_1fr]">

                      {/* BOOK COVER */}
                      <div className="flex justify-center md:justify-start">
                        <div className="flex h-40 w-28 items-center justify-center overflow-hidden rounded-xl bg-[#14112B]">

                          {reservation.sampul ? (
                            <img
                              src={reservation.sampul}
                              alt={reservation.judul}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="px-3 text-center text-xs text-gray-500">
                              No Cover
                            </span>
                          )}

                        </div>
                      </div>

                      {/* DETAILS */}
                      <div className="min-w-0">

                        {/* MEMBER */}
                        <div className="rounded-xl bg-[#14112B] p-4">

                          <p className="text-xs uppercase tracking-wider text-gray-500">
                            Mahasiswa
                          </p>

                          <p className="mt-2 font-semibold">
                            {reservation.nama_mahasiswa}
                          </p>

                          <p className="mt-1 text-sm text-gray-400">
                            {reservation.email_mahasiswa}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            No. Anggota: {reservation.nomor_anggota}
                          </p>

                        </div>

                        {/* INFORMATION */}
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                          <InfoCard
                            label="Tanggal Reservasi"
                            value={formatDate(reservation.reserved_at)}
                          />

                          <InfoCard
                            label="Posisi Antrean"
                            value={
                              reservation.status === "menunggu"
                                ? `#${reservation.posisi_antrean || reservation.queue_position || "-"}`
                                : "-"
                            }
                          />

                          <InfoCard
                            label="Stok Tersedia"
                            value={reservation.stok_tersedia}
                          />

                          {reservation.status === "siap_diambil" && (
                            <InfoCard
                              label="Batas Pengambilan"
                              value={formatDate(reservation.pickup_deadline)}
                            />
                          )}

                        </div>

                        {/* ACTIONS */}
                        <div className="mt-5 flex flex-wrap gap-3">

                          {reservation.status === "menunggu" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAction(
                                  reservation.id,
                                  "ready"
                                )
                              }
                              disabled={isLoading}
                              className="rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-[#14112B] transition hover:bg-green-400 disabled:opacity-50"
                            >
                              {isLoading
                                ? "Memproses..."
                                : "✓ Siapkan Buku"}
                            </button>
                          )}

                          {reservation.status === "siap_diambil" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAction(
                                  reservation.id,
                                  "complete"
                                )
                              }
                              disabled={isLoading}
                              className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
                            >
                              {isLoading
                                ? "Memproses..."
                                : "✓ Tandai Selesai"}
                            </button>
                          )}

                          {(reservation.status === "menunggu" ||
                            reservation.status === "siap_diambil") && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAction(
                                  reservation.id,
                                  "cancel"
                                )
                              }
                              disabled={isLoading}
                              className="rounded-xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                            >
                              Batalkan
                            </button>
                          )}

                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================
function StatCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#211C45] p-5">

      <p className="text-sm text-gray-400">
        {label}
      </p>

      <p className={`mt-3 text-3xl font-bold ${color}`}>
        {value}
      </p>

    </div>
  );
}

// =====================================================
// INFORMATION CARD
// =====================================================
function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#14112B] p-4">

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-white">
        {value}
      </p>

    </div>
  );
}