"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { processBookPickup } from "@/app/actions/pegawai-antrean";

export default function PickupActions({ loanId, kodePinjam }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePickup() {
    const confirmed = window.confirm(
      `Konfirmasi serah-terima buku untuk ${kodePinjam}? Setelah diproses, transaksi akan berstatus Sedang Dipinjam.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const result = await processBookPickup(loanId);

      if (result?.success) {
        window.alert(result.message);
        router.refresh();
      }
    } catch (err) {
      setError(
        err.message || "Gagal memproses serah-terima buku."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePickup}
        disabled={loading}
        className={`w-full rounded-xl px-4 py-3 font-semibold transition ${
          loading
            ? "cursor-not-allowed bg-gray-500 text-white"
            : "bg-[#f5b63f] text-[#100f24] hover:bg-[#ffd166]"
        }`}
      >
        {loading
          ? "Memproses Serah-Terima..."
          : "Proses Serah-Terima"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}