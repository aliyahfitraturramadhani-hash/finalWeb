"use client";

import { useState } from "react";
import { requestLoan } from "@/app/actions/mahasiswa-peminjaman";

export default function BukuDetailAction({
  bookId,
  available,
  blockedByFine = false,
  blockedAmount = 0,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRequest() {
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const result = await requestLoan([bookId]);

      setMessage(
        result?.message || "Pengajuan peminjaman berhasil dikirim."
      );

      setSuccess(true);
    } catch (error) {
      setMessage(error.message || "Pengajuan peminjaman gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">

      {/* BUTTON */}
      <button
        onClick={handleRequest}
        disabled={!available || blockedByFine || loading}
        className="w-full rounded-xl bg-[#F4B63F] px-6 py-4 font-bold text-[#111027] transition hover:bg-[#FFD16C] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {loading
          ? "Mengirim Pengajuan..."
          : "Ajukan Peminjaman Buku"}
      </button>

      {/* BLOKIR DENDA */}
      {blockedByFine && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          Pengajuan peminjaman diblokir karena kamu memiliki denda tertunggak
          sebesar Rp {Number(blockedAmount).toLocaleString("id-ID")}. Selesaikan
          pembayaran denda di meja sirkulasi terlebih dahulu.
        </div>
      )}

      {/* MESSAGE */}
      {message && (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}
        >
          {message}
        </div>
      )}

    </div>
  );
}