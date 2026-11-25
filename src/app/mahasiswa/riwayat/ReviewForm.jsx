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
      if (result.success) setKomentar("");
    });
  }

  if (success) {
    return (
      <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
        <p className="text-sm font-medium text-emerald-300">✓ {message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-2xl border border-[#44375F] bg-[#2D2545] p-5 sm:p-6"
    >
      {/* RATING */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-semibold text-[#F5F0FF]">
          Rating buku
        </label>
        <div className="flex gap-2" role="group" aria-label="Rating buku">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`Rating ${star}`}
              aria-pressed={rating === star}
              className={`text-3xl transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A6B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2545] ${
                star <= rating ? "text-[#C89A6B]" : "text-[#625677]"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-[#A99BC8]">{rating} dari 5 bintang</p>
      </div>

      {/* KOMENTAR */}
      <div className="mb-5">
        <label
          htmlFor={`komentar-${loanItemId}`}
          className="mb-2 block text-sm font-semibold text-[#F5F0FF]"
        >
          Komentar <span className="font-normal text-[#A99BC8]">(opsional)</span>
        </label>
        <textarea
          id={`komentar-${loanItemId}`}
          value={komentar}
          onChange={(event) => setKomentar(event.target.value)}
          placeholder="Bagaimana pendapatmu tentang buku ini?"
          rows={4}
          maxLength={2000}
          className="w-full resize-none rounded-xl border border-[#4A3B64] bg-[#211A35] p-3 text-sm leading-relaxed text-[#F5F0FF] outline-none transition placeholder:text-[#8F82AB] focus:border-[#9A789D] focus:ring-2 focus:ring-[#9A789D]/20"
        />
        <p className="mt-2 text-right text-xs text-[#A99BC8]">
          {komentar.length}/2000 karakter
        </p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-4 rounded-lg border p-3 text-sm ${
            success
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-rose-400/20 bg-rose-400/10 text-rose-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-[#7A303B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#93414B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A6B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2545] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Kirim Review"}
      </button>
    </form>
  );
}

