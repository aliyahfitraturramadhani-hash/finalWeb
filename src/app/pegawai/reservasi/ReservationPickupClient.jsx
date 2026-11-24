"use client";

import { useState } from "react";
import { processReservationPickup } from "@/app/actions/pegawai-reservasi-pickup";
import { processExpiredReservations } from "@/app/actions/reservasi-expiry";

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function ReservationPickupClient({ reservations = [] }) {
  const [data, setData] = useState(reservations);
  const [loadingId, setLoadingId] = useState(null);
  const [sweeping, setSweeping] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  async function handlePickup(reservationId) {
    if (!window.confirm("Konfirmasi serah-terima buku reservasi kepada mahasiswa?")) return;
    setLoadingId(reservationId); setMessage(""); setMessageType("");
    try {
      const result = await processReservationPickup(reservationId);
      setData((prev) => prev.filter((item) => item.id !== reservationId));
      setMessage(result.message); setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Serah-terima gagal diproses."); setMessageType("error");
    } finally { setLoadingId(null); }
  }

  async function handleExpirySweep() {
    setSweeping(true); setMessage(""); setMessageType("");
    try {
      const result = await processExpiredReservations();
      setMessage(`Pemrosesan selesai: ${result.expired} reservasi kedaluwarsa dan ${result.allocated} reservasi baru disiapkan.`);
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Pemrosesan kedaluwarsa gagal."); setMessageType("error");
    } finally { setSweeping(false); }
  }

  return (
    <div className="min-h-screen bg-[#151229] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-[#827A9B]">Pegawai / Sirkulasi</p>
            <h1 className="mt-2 text-3xl font-bold">Serah-Terima Reservasi</h1>
            <p className="mt-2 text-sm text-gray-400">Proses penyerahan buku yang telah dialokasikan kepada mahasiswa.</p>
          </div>
          <button type="button" onClick={handleExpirySweep} disabled={sweeping}
            className="rounded-xl border border-[#F4B63F]/30 bg-[#F4B63F]/10 px-4 py-3 text-sm font-semibold text-[#F4B63F] hover:bg-[#F4B63F]/20 disabled:opacity-50">
            {sweeping ? "Memproses..." : "⟳ Proses Reservasi Kedaluwarsa"}
          </button>
        </div>

        {message && <div className={`mb-6 rounded-xl border px-4 py-3 ${messageType === "success" ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>{message}</div>}

        {data.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#211D39] p-10 text-center">
            <div className="mb-4 text-5xl">📚</div><h2 className="text-xl font-semibold">Tidak Ada Reservasi Siap Diambil</h2>
            <p className="mt-2 text-sm text-gray-400">Belum ada buku reservasi yang menunggu serah-terima.</p>
          </div>
        ) : <div className="space-y-5">{data.map((reservation) => (
          <div key={reservation.id} className="rounded-2xl border border-white/10 bg-[#211D39] p-5 md:p-6">
            <div className="mb-5"><p className="text-xs text-gray-500">Reservasi #{reservation.id}</p><h2 className="mt-2 text-xl font-bold">{reservation.judul}</h2><p className="mt-1 text-sm text-gray-400">{reservation.penulis}</p></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-[#151229] p-4"><p className="text-xs text-gray-500">Mahasiswa</p><p className="mt-2 font-semibold">{reservation.nama_mahasiswa}</p><p className="mt-1 text-sm text-gray-400">{reservation.email_mahasiswa}</p><p className="mt-2 text-xs text-gray-500">{reservation.nomor_anggota}</p></div>
              <div className="rounded-xl bg-[#151229] p-4"><p className="text-xs text-gray-500">Eksemplar</p><p className="mt-2 font-semibold">{reservation.kode_eksemplar || "-"}</p><p className="mt-3 text-xs text-gray-500">Batas Pengambilan</p><p className="mt-1 font-semibold text-yellow-400">{formatDate(reservation.pickup_deadline)}</p></div>
            </div>
            <div className="mt-5 flex justify-end"><button type="button" onClick={() => handlePickup(reservation.id)} disabled={loadingId === reservation.id}
              className="rounded-xl bg-[#F4B63F] px-5 py-3 font-semibold text-[#14112B] transition hover:bg-[#FFD16C] disabled:cursor-not-allowed disabled:opacity-50">
              {loadingId === reservation.id ? "Memproses..." : "✓ Proses Serah-Terima"}
            </button></div>
          </div>
        ))}</div>}
      </div>
    </div>
  );
}
