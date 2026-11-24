"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveLoanRequest,
  rejectLoanRequest,
} from "@/app/actions/pegawai-antrean";

export default function AntreanActions({ loanId, kodePinjam }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function handleApprove() {
    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menyetujui pengajuan ${kodePinjam}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const result = await approveLoanRequest(loanId);

      window.alert(result.message);
      router.refresh();
    } catch (err) {
      setError(err.message || "Gagal menyetujui pengajuan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await rejectLoanRequest(loanId, reason);

      window.alert(result.message);

      setShowRejectModal(false);
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err.message || "Gagal menolak pengajuan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="rounded-xl bg-[#f5b63f] px-5 py-3 font-semibold text-[#100f24] transition hover:bg-[#ffd06a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Konfirmasi Pengajuan"}
        </button>

        <button
          onClick={() => {
            setError("");
            setShowRejectModal(true);
          }}
          disabled={loading}
          className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
        >
          Tolak Pengajuan
        </button>
      </div>

      {error && !showRejectModal && (
        <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#211e3b] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">
              Tolak Pengajuan
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Pengajuan: {kodePinjam}
            </p>

            <label className="mt-5 block text-sm font-medium text-white">
              Alasan Penolakan
            </label>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan alasan penolakan pengajuan..."
              rows={4}
              disabled={loading}
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#100f24] p-4 text-white outline-none placeholder:text-gray-500 focus:border-[#f5b63f]/50"
            />

            {error && (
              <p className="mt-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setReason("");
                  setError("");
                }}
                disabled={loading}
                className="rounded-xl border border-white/10 px-4 py-3 text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                onClick={handleReject}
                disabled={loading}
                className="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Konfirmasi Penolakan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}