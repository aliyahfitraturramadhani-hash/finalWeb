"use client";

import { useState } from "react";
import { submitExtensionRequest } from "@/lib/mahasiswa/peminjaman-actions";

export default function PengajuanPerpanjangan({
  loan,
  onSuccess,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function closeModal() {
    if (loading) return;

    setIsOpen(false);
    setAlasan("");
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (alasan.trim().length < 10) {
      setMessage("Alasan minimal 10 karakter.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await submitExtensionRequest(
        loan.id,
        alasan.trim()
      );

      if (!result.success) {
        setMessage(result.message);
        setMessageType("error");
        return;
      }

      setMessage(result.message);
      setMessageType("success");

      setAlasan("");

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setIsOpen(false);
        setMessage("");
      }, 1500);

    } catch {
      setMessage("Terjadi kesalahan. Silakan coba lagi.");
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* BUTTON */}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-[#FFB82E]/30 px-4 py-2 text-xs font-semibold text-[#FFB82E] transition hover:bg-[#FFB82E]/10"
      >
        Ajukan Perpanjangan
      </button>

      {/* MODAL */}

      {isOpen && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >

          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#211D39] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* HEADER */}

            <div className="mb-6 flex items-start justify-between">

              <div>

                <h2 className="text-xl font-bold text-[#F5F0E8]">
                  Pengajuan Perpanjangan
                </h2>

                <p className="mt-1 text-sm text-[#A6A1BC]">
                  Ajukan tambahan waktu peminjaman buku.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="text-xl text-[#A6A1BC] transition hover:text-white disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* INFORMASI */}

            <div className="space-y-3 rounded-xl border border-white/5 bg-[#292443] p-4">

              <div>

                <p className="text-xs text-[#A6A1BC]">
                  Kode Peminjaman
                </p>

                <p className="mt-1 text-sm font-semibold text-[#FFB82E]">
                  {loan.kode_pinjam}
                </p>

              </div>

              <div>

                <p className="text-xs text-[#A6A1BC]">
                  Jatuh Tempo Saat Ini
                </p>

                <p className="mt-1 text-sm font-semibold text-[#F5F0E8]">
                  {formatTanggal(loan.jatuh_tempo)}
                </p>

              </div>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-4"
            >

              <div>

                <label
                  htmlFor="alasan"
                  className="mb-2 block text-sm font-semibold text-[#F5F0E8]"
                >
                  Alasan Perpanjangan
                </label>

                <textarea
                  id="alasan"
                  rows={4}
                  maxLength={500}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Jelaskan alasan kamu ingin memperpanjang masa peminjaman..."
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-white/5 bg-[#151229] p-4 text-sm text-[#F5F0E8] outline-none transition placeholder:text-[#827A9B] focus:border-[#FFB82E]/50 focus:ring-1 focus:ring-[#FFB82E]/20 disabled:opacity-50"
                />

                <p className="mt-2 text-right text-xs text-[#827A9B]">
                  {alasan.length}/500 karakter
                </p>

              </div>

              {/* MESSAGE */}

              {message && (

                <div
                  className={`rounded-xl border p-3 text-sm ${
                    messageType === "success"
                      ? "border-teal-500/20 bg-teal-500/10 text-teal-400"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {message}
                </div>

              )}

              {/* BUTTON */}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-[#A6A1BC] transition hover:bg-white/5 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#FFB82E] px-5 py-3 text-sm font-semibold text-[#151229] transition hover:bg-[#ffc64f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Mengirim..."
                    : "Kirim Pengajuan"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  );
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