"use client";

import { useState, useTransition } from "react";
import { submitReview } from "@/app/actions/mahasiswa-review";

export default function ReviewForm({ loanItemId }) {
  const [rating, setRating] = useState(5);
  const [komentar, setKomentar] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    const formData = new FormData();
    formData.set("loan_item_id", String(loanItemId));
    formData.set("rating", String(rating));
    formData.set("komentar", komentar);

    startTransition(async () => {
      const result = await submitReview(formData);

      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        setKomentar("");
      }
    });
  }

  if (success) {
    return (
      <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4">
        <p className="text-sm font-medium text-green-700">
          ✓ {message}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-2xl border border-[#D9C9B5] bg-[#FAF6F0] p-5"
    >
      {/* RATING */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-semibold text-[#292724]">
          Rating buku
        </label>

        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`Rating ${star}`}
              className={`text-3xl transition ${
                star <= rating
                  ? "text-[#B58A62]"
                  : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <p className="mt-1 text-xs text-gray-500">
          {rating} dari 5 bintang
        </p>
      </div>

      {/* KOMENTAR */}
      <div className="mb-4">
        <label
          htmlFor={`komentar-${loanItemId}`}
          className="mb-2 block text-sm font-semibold text-[#292724]"
        >
          Komentar (opsional)
        </label>

        <textarea
          id={`komentar-${loanItemId}`}
          value={komentar}
          onChange={(event) => setKomentar(event.target.value)}
          placeholder="Bagaimana pendapatmu tentang buku ini?"
          rows={4}
          maxLength={2000}
          className="w-full resize-none rounded-xl border border-[#D9C9B5] bg-white p-3 text-sm text-[#292724] outline-none transition focus:border-[#722F37] focus:ring-2 focus:ring-[#722F37]/10"
        />

        <p className="mt-1 text-right text-xs text-gray-500">
          {komentar.length}/2000 karakter
        </p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-3 rounded-lg p-3 text-sm ${
            success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-[#722F37] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5C252C] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Kirim Review"}
      </button>
    </form>
  );
}