import Link from "next/link";
import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getStudentBookDetail } from "@/app/actions/mahasiswa-detail-buku";
import BukuDetailAction from "./BukuDetailAction";
import ReviewSection from "./ReviewSection";

export default async function DetailBukuPage({ params }) {
  const { id } = await params;
  const book = await getStudentBookDetail(id);

  if (!book) {
    return (
      <div className="min-h-screen bg-[#111027] text-[#F5F0E8] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Buku tidak ditemukan</h1>
          <Link
            href="/mahasiswa/katalog"
            className="text-[#F4B63F] hover:underline"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  // Cek denda tertunggak agar tombol pinjam ikut terblokir di UI
  const user = await getActiveUser("member");

  const fineRows = await query(
    `
      SELECT
        COUNT(*)::int AS jumlah_denda,
        COALESCE(SUM(f.jumlah_denda), 0)::float AS total_denda
      FROM fines f
      JOIN loan_items li ON li.id = f.loan_item_id
      JOIN loans l ON l.id = li.loan_id
      JOIN members m ON m.id = l.member_id
      WHERE m.user_id = $1
        AND f.status = 'belum_dibayar'
    `,
    [user.id]
  );

  const blockedByFine = Number(fineRows[0]?.jumlah_denda || 0) > 0;
  const blockedAmount = Number(fineRows[0]?.total_denda || 0);

  const kategori = Array.isArray(book.kategori) ? book.kategori : [];
  const rating = Number(book.rating_rata_rata || 0);
  const reviewCount = Number(book.jumlah_review || 0);
  const available = Number(book.stok_tersedia || 0) > 0;
  const reviews = Array.isArray(book.reviews) ? book.reviews : [];

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter(
      (review) => Number(review.rating) === star
    ).length;

    return {
      star,
      count,
      percentage: reviewCount > 0 ? (count / reviewCount) * 100 : 0,
    };
  });

  return (
    <main className="min-h-screen bg-[#111027] text-[#F5F0E8] px-6 md:px-12 py-8">

      {/* KEMBALI */}
      <Link
        href="/mahasiswa/katalog"
        className="inline-flex items-center gap-2 text-[#A5A0C5] hover:text-[#F4B63F] transition mb-10 text-lg"
      >
        ← Kembali ke Katalog
      </Link>

{/* DETAIL UTAMA */}
<section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 xl:gap-14 items-start">

  {/* COVER */}
  <div className="w-full flex justify-center">
    <div className="w-full max-w-[380px] aspect-[2/3] rounded-2xl overflow-hidden bg-[#292546] shadow-xl">
      {book.sampul ? (
        <img
          src={book.sampul}
          alt={`Cover ${book.judul}`}
          className="w-full h-full object-cover object-center"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-center p-6 text-[#A5A0C5]">
          Cover buku tidak tersedia
        </div>
      )}
    </div>
  </div>

  {/* INFORMASI BUKU */}
  <div className="w-full min-w-0">

    {/* LABEL */}
    <p className="text-[#F4B63F] tracking-[0.25em] uppercase font-semibold text-sm mb-4">
      Booklyn Library
    </p>

    {/* JUDUL */}
    <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold leading-tight mb-4 break-words">
      {book.judul}
    </h1>

    {/* PENULIS */}
    <p className="text-[#A5A0C5] text-lg md:text-xl mb-6">
      {book.penulis || "Penulis tidak diketahui"}
    </p>

    {/* RATING */}
    <div className="flex items-center gap-3 flex-wrap mb-6">
      <span className="text-[#F4B63F] text-2xl">★</span>

      <span className="text-[#F4B63F] text-xl font-bold">
        {rating.toFixed(1)}
      </span>

      <span className="text-[#A5A0C5] text-base">
        ({reviewCount} review)
      </span>
    </div>

    {/* KATEGORI */}
    {kategori.length > 0 && (
      <div className="flex flex-wrap gap-2.5 mb-7">
        {kategori.map((namaKategori) => (
          <span
            key={namaKategori}
            className="px-4 py-2 rounded-full bg-[#292546] text-[#F4B63F] text-sm md:text-base"
          >
            {namaKategori}
          </span>
        ))}
      </div>
    )}

    {/* STOK */}
    <div className="mb-7">
      <span
        className={`inline-flex items-center px-5 py-3 rounded-full font-semibold text-base ${
          available
            ? "bg-[#062D28] text-[#00D6A0]"
            : "bg-[#3B1F2B] text-[#FF7B91]"
        }`}
      >
        {available
          ? `${book.stok_tersedia} eksemplar tersedia`
          : "Stok tidak tersedia"}
      </span>
    </div>

    {/* ACTION */}
    <div className="mb-8">
     <BukuDetailAction
  bookId={book.id}
  available={available}
  blockedByFine={blockedByFine}
  blockedAmount={blockedAmount}
/>
    </div>

    {/* INFORMASI TAMBAHAN */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      <div className="rounded-xl border border-[#393456] bg-[#1D1B37] p-5">
        <p className="text-[#A5A0C5] text-sm mb-2">ISBN</p>
        <p className="font-semibold break-words">
          {book.isbn || "-"}
        </p>
      </div>

      <div className="rounded-xl border border-[#393456] bg-[#1D1B37] p-5">
        <p className="text-[#A5A0C5] text-sm mb-2">Penerbit</p>
        <p className="font-semibold break-words">
          {book.penerbit || "-"}
        </p>
      </div>

      <div className="rounded-xl border border-[#393456] bg-[#1D1B37] p-5">
        <p className="text-[#A5A0C5] text-sm mb-2">Tahun Terbit</p>
        <p className="font-semibold">
          {book.tahun_terbit || "-"}
        </p>
      </div>

      <div className="rounded-xl border border-[#393456] bg-[#1D1B37] p-5">
        <p className="text-[#A5A0C5] text-sm mb-2">Lokasi Rak</p>
        <p className="font-semibold break-words">
          {book.lokasi_rak || "-"}
        </p>
      </div>

      <div className="rounded-xl border border-[#393456] bg-[#1D1B37] p-5">
        <p className="text-[#A5A0C5] text-sm mb-2">
          Maksimal Peminjaman
        </p>
        <p className="font-semibold">
          {book.durasi_maksimal_pinjam_hari
            ? `${book.durasi_maksimal_pinjam_hari} hari`
            : "-"}
        </p>
      </div>

      <div className="rounded-xl border border-[#393456] bg-[#1D1B37] p-5">
        <p className="text-[#A5A0C5] text-sm mb-2">
          Denda per Hari
        </p>
        <p className="font-semibold">
          {book.tarif_denda_harian != null
            ? `Rp ${Number(book.tarif_denda_harian).toLocaleString("id-ID")}`
            : "-"}
        </p>
      </div>

    </div>
  </div>
</section>


      {/* DESKRIPSI */}
      <section className="mt-16 rounded-3xl border border-[#393456] bg-[#1D1B37] p-8 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-[#F4B63F] mb-6">
          Tentang Buku
        </h2>

        <p className="text-[#A5A0C5] leading-relaxed text-lg whitespace-pre-line">
          {book.deskripsi || "Belum ada deskripsi untuk buku ini."}
        </p>
      </section>

      {/* RATING DAN REVIEW */}
      <section className="mt-16">
        <h2 className="text-2xl md:text-3xl font-bold text-[#F4B63F] mb-8">
          Rating & Review
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

          {/* RATING SUMMARY */}
          <div className="rounded-3xl border border-[#393456] bg-[#1D1B37] p-8 flex flex-col items-center justify-center">
            <p className="text-[#F4B63F] text-6xl font-bold">
              {rating.toFixed(1)}
            </p>

            <div className="text-[#F4B63F] text-2xl mt-3">
              {"★".repeat(Math.round(rating))}
              {"☆".repeat(5 - Math.round(rating))}
            </div>

            <p className="text-[#A5A0C5] mt-4">
              {reviewCount} review
            </p>
          </div>

          {/* RATING DISTRIBUTION */}
          <div className="lg:col-span-2 rounded-3xl border border-[#393456] bg-[#1D1B37] p-8">
            <h3 className="font-bold text-xl mb-6">
              Distribusi Rating
            </h3>

            <div className="space-y-4">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div
                  key={star}
                  className="flex items-center gap-4"
                >
                  <span className="w-10 text-[#F4B63F]">
                    {star} ★
                  </span>

                  <div className="flex-1 h-3 bg-[#292546] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F4B63F] rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-10 text-right text-[#A5A0C5]">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* REVIEW */}
        <ReviewSection reviews={reviews} />
      </section>

    </main>
  );
}