"use client";

import { useState, useTransition } from "react";
import { prosesPengajuanPerpanjangan } from "@/lib/pegawai/pengajuan-perpanjangan-actions";

export default function PengajuanPerpanjanganActions({ requestId }) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [message, setMessage] = useState("");

  function handleApprove() {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin menyetujui pengajuan perpanjangan ini?"
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await prosesPengajuanPerpanjangan(
        requestId,
        "approved",
        ""
      );

      setMessage(result.message);

      if (result.success) {
        window.location.reload();
      }
    });
  }

  function handleReject() {
    if (catatan.trim().length < 5) {
      setMessage("Catatan penolakan minimal 5 karakter.");
      return;
    }

    startTransition(async () => {
      const result = await prosesPengajuanPerpanjangan(
        requestId,
        "rejected",
        catatan.trim()
      );

      setMessage(result.message);

      if (result.success) {
        window.location.reload();
      }
    });
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-5">
      {!showReject ? (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            {isPending ? "Memproses..." : "✓ Setujui"}
          </button>

          <button
            onClick={() => {
              setShowReject(true);
              setMessage("");
            }}
            disabled={isPending}
            className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-400/20 disabled:opacity-50"
          >
            ✕ Tolak
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-rose-300">
              Catatan Penolakan
            </label>

            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tuliskan alasan penolakan pengajuan..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#211C42] p-4 text-sm text-white outline-none transition focus:border-rose-400/50"
            />

            <p className="mt-1 text-right text-xs text-[#A9A4C4]">
              {catatan.length}/500 karakter
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleReject}
              disabled={isPending}
              className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
            >
              {isPending ? "Memproses..." : "Konfirmasi Penolakan"}
            </button>

            <button
              onClick={() => {
                setShowReject(false);
                setCatatan("");
                setMessage("");
              }}
              disabled={isPending}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-[#A9A4C4] transition hover:bg-white/5"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="mt-3 text-sm text-rose-300">
          {message}
        </p>
      )}

      {isPending && (
        <p className="mt-3 text-sm text-[#A9A4C4]">
          Sedang memproses keputusan...
        </p>
      )}
    </div>
  );
}