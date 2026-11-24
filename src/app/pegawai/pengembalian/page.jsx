import { searchActiveLoans } from "@/app/actions/pegawai-antrean";
import { getLoanRequestDetails } from "@/app/actions/pegawai-antrean";
import ReturnActions from "./ReturnActions";

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function PengembalianPage({ searchParams }) {
  const params = await searchParams;
  const keyword = params?.q || "";

  const loans = await searchActiveLoans(keyword);

  return (
    <main className="min-h-screen bg-[#100f24] p-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <header>
          <p className="text-sm font-semibold tracking-[0.25em] text-[#f5b63f]">
            BOOKLYN LIBRARY
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Book Returns
          </h1>

          <p className="mt-2 text-gray-400">
            Kelola pengembalian buku dan pemeriksaan transaksi peminjaman.
          </p>
        </header>

        {/* STATISTIK */}
        <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#211e3b] p-6">
            <p className="text-sm text-gray-400">
              Transaksi Aktif
            </p>

            <h2 className="mt-3 text-4xl font-bold text-[#f5b63f]">
              {loans.length}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Transaksi ditemukan dari pencarian.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#211e3b] p-6">
            <p className="text-sm text-gray-400">
              Modul
            </p>

            <h2 className="mt-3 text-xl font-bold">
              Pengembalian
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Pemeriksaan transaksi aktif.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#211e3b] p-6">
            <p className="text-sm text-gray-400">
              Sistem Sirkulasi
            </p>

            <h2 className="mt-3 text-xl font-bold text-[#f5b63f]">
              BOOKLYN
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Meja pengembalian buku.
            </p>
          </div>
        </section>

        {/* SEARCH */}
        <section className="mt-10">
          <div className="rounded-2xl border border-white/10 bg-[#211e3b] p-6">
            <h2 className="text-xl font-semibold">
              Cari Transaksi
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Cari berdasarkan kode peminjaman, nomor anggota,
              nama mahasiswa, atau email.
            </p>

            <form
              method="GET"
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="text"
                name="q"
                defaultValue={keyword}
                placeholder="Masukkan kode peminjaman atau identitas mahasiswa..."
                className="w-full rounded-xl border border-white/10 bg-[#100f24] px-4 py-3 text-white outline-none transition focus:border-[#f5b63f]"
              />

              <button
                type="submit"
                className="rounded-xl bg-[#f5b63f] px-6 py-3 font-semibold text-[#100f24] transition hover:bg-amber-300"
              >
                Cari
              </button>
            </form>
          </div>
        </section>

        {/* DAFTAR TRANSAKSI */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">
                Daftar Peminjaman Aktif
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Transaksi yang bukunya belum dikembalikan.
              </p>
            </div>

            <span className="rounded-full border border-[#f5b63f]/30 bg-[#f5b63f]/10 px-4 py-2 text-sm text-[#f5b63f]">
              {loans.length} Transaksi
            </span>
          </div>

          {loans.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#211e3b] p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5b63f]/10 text-3xl">
                📚
              </div>

              <h3 className="text-lg font-semibold">
                Tidak Ada Transaksi
              </h3>

              <p className="mt-2 text-gray-400">
                {keyword
                  ? "Transaksi tidak ditemukan berdasarkan pencarian."
                  : "Belum ada transaksi peminjaman aktif."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {loans.map(async (loan) => {
                const books = await getLoanRequestDetails(loan.id);

                const overdue =
                  loan.jatuh_tempo &&
                  new Date(loan.jatuh_tempo) <
                    new Date(new Date().toDateString());

                return (
                  <article
                    key={loan.id}
                    className="rounded-2xl border border-white/10 bg-[#211e3b] p-6 transition hover:border-[#f5b63f]/30"
                  >
                    {/* IDENTITAS */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#f5b63f]">
                          {loan.kode_pinjam}
                        </p>

                        <h3 className="mt-2 text-xl font-bold">
                          {loan.nama_mahasiswa}
                        </h3>

                        <p className="mt-1 text-sm text-gray-400">
                          {loan.email_mahasiswa}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          Nomor anggota: {loan.nomor_anggota}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-4 py-2 text-sm ${
                          overdue
                            ? "border-red-400/20 bg-red-400/10 text-red-300"
                            : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        }`}
                      >
                        {overdue
                          ? "Terlambat"
                          : "Sedang Dipinjam"}
                      </span>
                    </div>

                    {/* DETAIL BUKU */}
                        <div className="mt-5 border-t border-white/10 pt-5">
                        <p className="mb-3 font-semibold">
                            Buku yang dipinjam ({books.length})
                        </p>

                        <div className="space-y-3">
                            {books.map((book) => (
                            <div
                                key={book.loan_item_id}
                                className="rounded-xl bg-[#100f24]/70 p-4"
                            >
                                <p className="font-medium">
                                {book.judul}
                                </p>

                                <p className="mt-1 text-sm text-gray-400">
                                {book.penulis || "Penulis tidak diketahui"}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                ISBN: {book.isbn || "-"}
                                </p>

                                {/* ACTION PENGEMBALIAN */}
                                <ReturnActions
                                loanItemId={book.loan_item_id}
                                judul={book.judul}
                                />
                            </div>
                            ))}
                        </div>
                        </div>

                    {/* WAKTU */}
                    <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-400">
                      <p>
                        Tanggal pinjam:{" "}
                        {formatDate(loan.tanggal_pinjam)}
                      </p>

                      <p>
                        Jatuh tempo:{" "}
                        {formatDate(loan.jatuh_tempo)}
                      </p>
                    </div>

                    {/* INFO */}
                    <div className="mt-6 rounded-xl border border-[#f5b63f]/10 bg-[#f5b63f]/5 p-4">
                      <p className="font-semibold text-[#f5b63f]">
                        Informasi Pengembalian
                      </p>

                      <p className="mt-2 text-sm leading-relaxed text-gray-400">
                        Periksa buku dan identitas transaksi
                        sebelum pengembalian diproses.
                        Perhitungan denda akan dilakukan
                        pada tahap berikutnya.
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}