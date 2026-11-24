"use client";

import { useState, useTransition } from "react";
import { processReturn } from "@/app/actions/pegawai-pengembalian";

export default function ReturnActions({ loanItemId, judul }) {
  const [kondisi, setKondisi] = useState("baik");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleReturn() {
    const konfirmasi = window.confirm(
      `Proses pengembalian buku "${judul}" dengan kondisi "${kondisi}"?`
    );

    if (!konfirmasi) return;

    setMessage("");

    startTransition(async () => {
      try {
        const result = await processReturn(loanItemId, kondisi);

        if (result.success) {
          setMessage(
            `Pengembalian berhasil! Keterlambatan: ${result.hari_terlambat} hari.`
          );

          window.location.reload();
        }
      } catch (error) {
        setMessage(error.message || "Pengembalian gagal diproses.");
      }
    });
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <label className="mb-2 block text-sm font-medium text-gray-300">
        Kondisi Buku Saat Dikembalikan
      </label>

      <select
        value={kondisi}
        onChange={(e) => setKondisi(e.target.value)}
        disabled={isPending}
        className="w-full rounded-xl border border-white/10 bg-[#211e3b] px-4 py-3 text-white outline-none focus:border-[#f5b63f]"
      >
        <option value="baik">Baik</option>
        <option value="rusak">Rusak</option>
        <option value="hilang">Hilang</option>
      </select>

      <button
        onClick={handleReturn}
        disabled={isPending}
        className="mt-3 w-full rounded-xl bg-[#f5b63f] px-4 py-3 font-semibold text-[#100f24] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Memproses..." : "Proses Pengembalian"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-gray-300">
          {message}
        </p>
      )}
    </div>
  );
}