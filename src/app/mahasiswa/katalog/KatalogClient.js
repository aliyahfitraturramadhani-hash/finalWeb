"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { requestLoan } from "@/app/actions/mahasiswa-peminjaman";
import { createReservation } from "@/app/actions/mahasiswa-reservasi";

export default function KatalogClient({ books = [] }) {
  const safeBooks = Array.isArray(books) ? books : [];

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [sort, setSort] = useState("judul");
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [viewMode, setViewMode] = useState("rak");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const booksPerPage = 9;

    const handleReservation = async (bookId) => {
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await createReservation(bookId);

      setMessage(
        `${result.message} Posisi antrean: ${result.queuePosition}.`
      );
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Reservasi gagal.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Baca kata kunci dari pencarian cepat di dashboard (?q=)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");

    if (q) setSearch(q);
  }, []);

  // =========================================
  // KATEGORI
  // =========================================

  const categories = useMemo(() => {
    const allCategories = safeBooks.flatMap((book) =>
      Array.isArray(book.kategori) ? book.kategori : []
    );

    return ["Semua", ...new Set(allCategories)];
  }, [safeBooks]);

  // =========================================
  // SEARCH, FILTER, SORT
  // =========================================

  const filteredBooks = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    let result = safeBooks.filter((book) => {
      const judul = String(book.judul || "").toLowerCase();
      const penulis = String(book.penulis || "").toLowerCase();

      const bookCategories = Array.isArray(book.kategori)
        ? book.kategori
        : [];

      const matchesSearch =
        judul.includes(keyword) ||
        penulis.includes(keyword) ||
        bookCategories.some((item) =>
          String(item).toLowerCase().includes(keyword)
        );

      const matchesCategory =
        category === "Semua" ||
        bookCategories.includes(category);

      return matchesSearch && matchesCategory;
    });

    if (sort === "judul") {
      result.sort((a, b) =>
        String(a.judul || "").localeCompare(
          String(b.judul || "")
        )
      );
    }

    if (sort === "tahun") {
      result.sort(
        (a, b) =>
          Number(b.tahun_terbit || 0) -
          Number(a.tahun_terbit || 0)
      );
    }

    if (sort === "stok") {
      result.sort(
        (a, b) =>
          Number(b.stok_tersedia || 0) -
          Number(a.stok_tersedia || 0)
      );
    }

    if (sort === "rating_tinggi") {
      result.sort(
        (a, b) =>
          Number(b.rating_rata_rata || 0) -
          Number(a.rating_rata_rata || 0)
      );
    }

    if (sort === "rating_rendah") {
      result.sort(
        (a, b) =>
          Number(a.rating_rata_rata || 0) -
          Number(b.rating_rata_rata || 0)
      );
    }

    return result;
  }, [safeBooks, search, category, sort]);

  // =========================================
  // PAGINATION
  // =========================================

  const totalPages = Math.ceil(
    filteredBooks.length / booksPerPage
  );

  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * booksPerPage;

    return filteredBooks.slice(
      startIndex,
      startIndex + booksPerPage
    );
  }, [filteredBooks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, sort]);

  // =========================================
  // PILIH BUKU
  // =========================================

  function toggleBook(bookId) {
    setMessage("");
    setMessageType("");

    setSelectedBooks((current) => {
      if (current.includes(bookId)) {
        return current.filter((id) => id !== bookId);
      }

      if (current.length >= 3) {
        setMessage("Maksimal 3 buku dalam satu pengajuan.");
        setMessageType("warning");
        return current;
      }

      return [...current, bookId];
    });
  }

  // =========================================
  // SUBMIT PEMINJAMAN
  // =========================================

  async function handleSubmit() {
    if (selectedBooks.length === 0) {
      setMessage("Pilih minimal satu buku terlebih dahulu.");
      setMessageType("warning");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await requestLoan(selectedBooks);

      // Mendukung action yang mengembalikan status eksplisit.
      if (result?.success === false) {
        throw new Error(
          result.message || "Pengajuan peminjaman gagal."
        );
      }

      setMessage(
        result?.message || "Pengajuan berhasil dikirim."
      );
      setMessageType("success");
      setSelectedBooks([]);
    } catch (error) {
      setMessage(
        error.message || "Terjadi kesalahan saat mengajukan peminjaman."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  // =========================================
  // BOOK CARD
  // =========================================

  function BookCard({ book }) {
    const isSelected = selectedBooks.includes(book.id);
    const available = Number(book.stok_tersedia || 0) > 0;

    const bookCategories = Array.isArray(book.kategori)
      ? book.kategori
      : [];

    const rating = Number(book.rating_rata_rata || 0);
    const reviewCount = Number(book.jumlah_review || 0);

    const detailUrl = `/mahasiswa/buku/${book.id}`;

    return (
      <article
        className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-[#1D1B37] transition duration-300 hover:border-[#F4B63F] ${
          isSelected
            ? "border-[#F4B63F] ring-1 ring-[#F4B63F]"
            : "border-[#393653]"
        }`}
      >
        {/* COVER */}

        <Link href={detailUrl} className="block">
          <div className="flex h-72 items-center justify-center bg-[#292546] p-6">
            {book.sampul ? (
              <img
                src={book.sampul}
                alt={book.judul || "Sampul buku"}
                className="h-full max-w-full rounded-lg object-contain shadow-lg transition duration-300 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full max-w-[180px] flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#483B78] to-[#9B2858] p-6 text-center shadow-lg">
                <span className="text-4xl">📚</span>

                <p className="mt-4 text-sm font-bold">
                  {book.judul || "Buku"}
                </p>
              </div>
            )}
          </div>
        </Link>

        {/* INFORMATION */}

        <div className="flex flex-1 flex-col p-5">
          <Link
            href={detailUrl}
            className="transition hover:text-[#F4B63F]"
          >
            <h2 className="line-clamp-2 text-xl font-bold">
              {book.judul || "Judul tidak tersedia"}
            </h2>
          </Link>

          <p className="mt-2 text-sm text-[#A6A0BE]">
            {book.penulis || "Penulis tidak diketahui"}
          </p>

          {/* RATING */}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[#F4B63F]">★</span>

            <span className="font-semibold text-[#F4B63F]">
              {reviewCount > 0
                ? rating.toFixed(1)
                : "Belum ada rating"}
            </span>

            {reviewCount > 0 && (
              <span className="text-xs text-[#A6A0BE]">
                ({reviewCount} review)
              </span>
            )}
          </div>

          {/* CATEGORY */}

          <div className="mt-4 flex flex-wrap gap-2">
            {bookCategories.map((item, index) => (
              <span
                key={`${book.id}-${item}-${index}`}
                className="rounded-full bg-[#343052] px-3 py-1 text-xs font-medium text-[#F4B63F]"
              >
                {item}
              </span>
            ))}
          </div>

          {/* YEAR */}

          {book.tahun_terbit && (
            <p className="mt-3 text-sm text-[#A6A0BE]">
              Tahun terbit: {book.tahun_terbit}
            </p>
          )}

          {/* STOCK */}

          <div className="mt-4 border-t border-[#393653] pt-4">
            <p className="text-sm text-[#A6A0BE]">
              Stok tersedia
            </p>

            <p
              className={`mt-2 text-lg font-bold ${
                available ? "text-[#27C3A5]" : "text-[#FF6485]"
              }`}
            >
              {book.stok_tersedia || 0}
            </p>
          </div>

{/* BUTTON */}

<div className="mt-auto pt-5">
  {available ? (
    <button
      onClick={() => toggleBook(book.id)}
      disabled={loading}
      className={`w-full rounded-xl py-3 font-semibold transition ${
        isSelected
          ? "bg-[#292546] text-[#F4B63F] ring-1 ring-[#F4B63F]"
          : "bg-[#F4B63F] text-[#111027] hover:bg-[#FFD16C]"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {isSelected ? "✓ Buku Dipilih" : "Ajukan Pinjam"}
    </button>
  ) : (
    <button
      onClick={() => handleReservation(book.id)}
      disabled={loading}
      className="w-full rounded-xl border border-[#F4B63F] bg-transparent py-3 font-semibold text-[#F4B63F] transition hover:bg-[#F4B63F] hover:text-[#111027] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? "Memproses..." : "Reservasi Buku"}
    </button>
  )}
</div>

        </div>
      </article>
    );
  }

  // =========================================
  // MAIN
  // =========================================

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#111027] px-5 py-6 text-[#F5F0E8] md:px-8 md:py-7">

      {/* HEADER */}

      <section className="mb-8">
        <p className="text-sm font-semibold tracking-[0.2em] text-[#F4B63F]">
          BOOKLYN LIBRARY
        </p>

        <h1 className="mt-3 text-4xl font-bold md:text-5xl">
          Book Catalogue
        </h1>

        <p className="mt-3 max-w-2xl text-[#A6A0BE]">
          Jelajahi koleksi buku perpustakaan dan temukan
          bacaan yang menarik untukmu.
        </p>
      </section>

      {/* SEARCH */}

      <section className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul, pengarang, atau kategori..."
          className="w-full min-w-0 rounded-2xl border border-[#393653] bg-[#1D1B37] px-5 py-4 text-white outline-none transition placeholder:text-[#77728F] focus:border-[#F4B63F]"
        />
      </section>

      {/* CATEGORY */}

      <section className="mb-6 w-full min-w-0">
        <div className="flex w-full gap-3 overflow-x-auto pb-3">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full border px-5 py-2 text-sm transition ${
                category === item
                  ? "border-[#F4B63F] bg-[#F4B63F] font-semibold text-[#111027]"
                  : "border-[#4A4566] bg-[#1D1B37] text-[#A6A0BE] hover:border-[#F4B63F]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* SORT */}

      <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <span className="text-sm text-[#A6A0BE]">
          Urutkan:
        </span>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-2xl border border-[#393653] bg-[#1D1B37] px-5 py-4 text-white outline-none focus:border-[#F4B63F] sm:w-auto"
        >
          <option value="judul">Judul</option>
          <option value="tahun">Tahun Terbit Terbaru</option>
          <option value="stok">Stok Terbanyak</option>
          <option value="rating_tinggi">Rating Tertinggi</option>
          <option value="rating_rendah">Rating Terendah</option>
        </select>
      </section>

      {/* VIEW MODE */}

      <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#A6A0BE]">
          {filteredBooks.length} buku ditemukan
        </p>

        <div className="flex rounded-2xl border border-[#393653] bg-[#1D1B37] p-1">
          <button
            onClick={() => setViewMode("rak")}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
              viewMode === "rak"
                ? "bg-[#F4B63F] text-[#111027]"
                : "text-[#A6A0BE] hover:text-white"
            }`}
          >
            ▦ Rak
          </button>

          <button
            onClick={() => setViewMode("flow")}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
              viewMode === "flow"
                ? "bg-[#F4B63F] text-[#111027]"
                : "text-[#A6A0BE] hover:text-white"
            }`}
          >
            ↔ Flow
          </button>
        </div>
      </section>

      {/* SELECTION */}

      <section className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#393653] bg-[#1D1B37] p-5">
        <div>
          <p className="font-semibold text-[#F4B63F]">
            {selectedBooks.length}/3 buku dipilih
          </p>

          <p className="mt-1 text-sm text-[#A6A0BE]">
            Maksimal 3 buku dalam satu pengajuan.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || selectedBooks.length === 0}
          className="w-full rounded-xl bg-[#F4B63F] px-6 py-3 font-semibold text-[#111027] transition hover:bg-[#FFD16C] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {loading
            ? "Mengirim..."
            : `Ajukan Peminjaman (${selectedBooks.length})`}
        </button>
      </section>

      {/* MESSAGE */}

      {message && (
        <div
          role="status"
          className={`mb-6 rounded-xl border p-4 text-sm ${
            messageType === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : messageType === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-[#F4B63F]/30 bg-[#F4B63F]/10 text-[#F4B63F]"
          }`}
        >
          {message}
        </div>
      )}

      {/* EMPTY & BOOK DISPLAY */}

      {filteredBooks.length === 0 ? (
        <div className="rounded-2xl border border-[#393653] bg-[#1D1B37] p-12 text-center">
          <p className="text-lg font-semibold">
            Buku tidak ditemukan.
          </p>

          <p className="mt-2 text-sm text-[#A6A0BE]">
            Coba kata pencarian atau kategori lain.
          </p>
        </div>
      ) : viewMode === "rak" ? (
        <>
          {/* MODE RAK */}

          <section className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </section>

          {/* PAGINATION */}

          {totalPages > 1 && (
            <section className="mt-12 flex flex-col items-center gap-5">
              <p className="text-sm text-[#A6A0BE]">
                Halaman {currentPage} dari {totalPages}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-xl border border-[#393653] bg-[#1D1B37] px-5 py-3 text-[#A6A0BE] transition hover:border-[#F4B63F] hover:text-[#F4B63F] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ←
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-xl border px-5 py-3 font-semibold transition ${
                      currentPage === page
                        ? "border-[#F4B63F] bg-[#F4B63F] text-[#111027]"
                        : "border-[#393653] bg-[#1D1B37] text-white hover:border-[#F4B63F]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-[#393653] bg-[#1D1B37] px-5 py-3 text-[#A6A0BE] transition hover:border-[#F4B63F] hover:text-[#F4B63F] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </section>
          )}
        </>
      ) : (
        /* MODE FLOW */

        <section className="w-full min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[#A6A0BE]">
              Geser untuk menjelajahi seluruh koleksi →
            </p>
          </div>

          <div
            className="flex w-full gap-6 overflow-x-auto overscroll-x-contain pb-6 snap-x snap-mandatory"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#F4B63F #1D1B37",
            }}
          >
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="w-[280px] flex-none snap-start sm:w-[320px]"
              >
                <BookCard book={book} />
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}