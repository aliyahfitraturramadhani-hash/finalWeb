"use client";

import { useState } from "react";

export default function ReviewSection({ reviews = [] }) {
  const [selectedRating, setSelectedRating] = useState("all");

  const filteredReviews =
    selectedRating === "all"
      ? reviews
      : reviews.filter(
          (review) =>
            Number(review.rating) === Number(selectedRating)
        );

  return (
    <div>
      {/* FILTER */}
      <div className="mb-6 flex flex-wrap gap-3">

        <button
          onClick={() => setSelectedRating("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            selectedRating === "all"
              ? "bg-[#F4B63F] text-[#111027]"
              : "border border-[#393653] bg-[#1D1B37] text-[#A6A0BE] hover:border-[#F4B63F]"
          }`}
        >
          Semua
        </button>

        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            onClick={() => setSelectedRating(String(star))}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedRating === String(star)
                ? "bg-[#F4B63F] text-[#111027]"
                : "border border-[#393653] bg-[#1D1B37] text-[#A6A0BE] hover:border-[#F4B63F]"
            }`}
          >
            {star} ★
          </button>
        ))}

      </div>

      {/* REVIEW LIST */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-2xl border border-[#393653] bg-[#1D1B37] p-8 text-center">
          <p className="text-[#A6A0BE]">
            Tidak ada ulasan dengan rating ini.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredReviews.map((review, index) => (
            <article
              key={`${review.created_at}-${index}`}
              className="rounded-2xl border border-[#393653] bg-[#1D1B37] p-6 transition hover:border-[#F4B63F]/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">

                <p className="font-semibold text-[#F5F0E8]">
                  {review.nama_pengulas || "Anggota Perpustakaan"}
                </p>

                <div className="flex items-center gap-2 text-[#F4B63F]">
                  <span>
                    {"★".repeat(Number(review.rating || 0))}
                  </span>

                  <span className="text-sm font-semibold">
                    {review.rating}/5
                  </span>
                </div>

              </div>

              <p className="mt-4 leading-7 text-[#C3BDD7]">
                {review.komentar || "Tidak ada komentar."}
              </p>

              <p className="mt-4 text-xs text-[#77728F]">
                {review.created_at
                  ? new Date(review.created_at).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )
                  : ""}
              </p>

            </article>
          ))}
        </div>
      )}
    </div>
  );
}