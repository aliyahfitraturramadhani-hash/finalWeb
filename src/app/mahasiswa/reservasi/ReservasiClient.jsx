"use client";

import { useState } from "react";
import { cancelReservation } from "@/app/actions/mahasiswa-reservasi";

const statusConfig = {
  menunggu: {
    label: "Menunggu",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    icon: "⏳",
  },
  siap_diambil: {
    label: "Siap Diambil",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: "📦",
  },
  selesai: {
    label: "Selesai",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: "✓",
  },
  dibatalkan: {
    label: "Dibatalkan",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: "✕",
  },
  kedaluwarsa: {
    label: "Kedaluwarsa",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: "⌛",
  },
};

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ReservasiClient({ reservations = [] }) {
  const [data, setData] = useState(reservations);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  async function handleCancel(id) {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin membatalkan reservasi buku ini?"
    );

    if (!confirmed) return;

    setLoadingId(id);
    setMessage("");
    setMessageType("");

    try {
      const result = await cancelReservation(id);

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

      setMessage(result.message || "Reservasi berhasil dibatalkan.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Gagal membatalkan reservasi.");
      setMessageType("error");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#151229] px-4 py-8 text-[#F5F0E8] md:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#827A9B]">
            Member Center / Reservasi
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Reservasi Saya
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#A6A1BC]">
            Pantau antrean buku yang kamu reservasi dan status pengambilan
            buku.
          </p>
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

        {/* EMPTY STATE */}
        {data.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#211D39] p-10 text-center">
            <div className="mb-4 text-5xl">📚</div>

            <h2 className="text-xl font-semibold">
              Belum Ada Reservasi
            </h2>

            <p className="mt-2 text-sm text-[#A6A1BC]">
              Kamu belum memiliki reservasi buku.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {data.map((reservation) => {
              const status =
                statusConfig[reservation.status] ||
                statusConfig.menunggu;

              return (
                <div
                  key={reservation.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#211D39]"
                >
                  <div className="flex flex-col gap-5 p-5 md:flex-row md:p-6">

                    {/* BOOK COVER */}
                    <div className="flex shrink-0 justify-center md:justify-start">
                      <div className="flex h-44 w-32 items-center justify-center overflow-hidden rounded-xl bg-[#292546]">
                        {reservation.cover_url ? (
                          <img
                            src={reservation.cover_url}
                            alt={reservation.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="px-3 text-center text-sm text-[#A6A1BC]">
                            No Cover
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="min-w-0 flex-1">

                      {/* TITLE */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold">
                            {reservation.title}
                          </h2>

                          <p className="mt-1 text-sm text-[#A6A1BC]">
                            {reservation.author || "Penulis tidak diketahui"}
                          </p>
                        </div>

                        {/* STATUS */}
                        <span
                          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.color}`}
                        >
                          {status.icon} {status.label}
                        </span>
                      </div>

                      {/* DETAILS */}
                      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <div className="rounded-xl bg-[#151229] p-4">
                          <p className="text-xs text-[#827A9B]">
                            Posisi Antrean
                          </p>

                          <p className="mt-1 text-lg font-bold text-[#FFB82E]">
                            {reservation.status === "menunggu"
                              ? `#${reservation.queue_position || "-"}`
                              : "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#151229] p-4">
                          <p className="text-xs text-[#827A9B]">
                            Tanggal Reservasi
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatDate(reservation.reserved_at)}
                          </p>
                        </div>

                        {reservation.status === "siap_diambil" && (
                          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 sm:col-span-2">
                            <p className="text-xs text-green-400">
                              Batas Pengambilan
                            </p>

                            <p className="mt-1 font-semibold text-green-300">
                              {formatDate(reservation.pickup_deadline)}
                            </p>

                            <p className="mt-2 text-xs leading-5 text-green-400/70">
                              Silakan datang ke perpustakaan sebelum batas
                              waktu pengambilan.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* CANCEL */}
                      {reservation.status === "menunggu" && (
                        <div className="mt-5 flex justify-end">
                          <button
                            onClick={() => handleCancel(reservation.id)}
                            disabled={loadingId === reservation.id}
                            className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {loadingId === reservation.id
                              ? "Membatalkan..."
                              : "Batalkan Reservasi"}
                          </button>
                        </div>
                      )}
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