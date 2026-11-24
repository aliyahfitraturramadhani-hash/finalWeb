import {
  getLoanRequests,
  getLoanRequestDetails,
} from "@/app/actions/pegawai-antrean";

import AntreanActions from "./AntreanActions";

export default async function AntreanPage() {
  const requests = await getLoanRequests();

  return (
    <main className="min-h-screen bg-[#14112B] px-5 pb-8 pt-6 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#f5b63f]">
          BOOKLYN LIBRARY
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Loan Requests
        </h1>

        <p className="mt-2 text-gray-400">
          Kelola dan proses pengajuan peminjaman buku mahasiswa.
        </p>

        {/* STATISTIK PENGAJUAN */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#211e3b] p-6">
          <p className="text-sm text-gray-400">
            Pengajuan Menunggu
          </p>

          <h2 className="mt-2 text-4xl font-bold text-[#f5b63f]">
            {requests.length}
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Pengajuan membutuhkan konfirmasi pegawai.
          </p>
        </section>

        {/* DAFTAR PENGAJUAN */}
        <section className="mt-8">
          <h2 className="mb-5 text-2xl font-semibold">
            Daftar Pengajuan
          </h2>

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#211e3b] p-10 text-center">
              <p className="text-gray-400">
                Belum ada pengajuan peminjaman yang menunggu.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map(async (request) => {
                const books = await getLoanRequestDetails(request.id);

                return (
                  <article
                    key={request.id}
                    className="rounded-2xl border border-white/10 bg-[#211e3b] p-6"
                  >
                    {/* INFORMASI MAHASISWA */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#f5b63f]">
                          {request.kode_pinjam}
                        </p>

                        <h3 className="mt-2 text-xl font-bold">
                          {request.nama_mahasiswa}
                        </h3>

                        <p className="mt-1 text-sm text-gray-400">
                          {request.email_mahasiswa}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          Nomor anggota: {request.nomor_anggota}
                        </p>
                      </div>

                      <span className="rounded-full border border-[#f5b63f]/30 bg-[#f5b63f]/10 px-4 py-2 text-sm text-[#f5b63f]">
                        Menunggu Konfirmasi
                      </span>
                    </div>

                    {/* DETAIL BUKU */}
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <p className="mb-3 font-semibold">
                        Buku yang diajukan ({books.length})
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
                              {book.penulis ||
                                "Penulis tidak diketahui"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              ISBN: {book.isbn || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* WAKTU PENGAJUAN */}
                    <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-400">
                      <p>
                        Waktu pengajuan:{" "}
                        {new Date(request.created_at).toLocaleString(
                          "id-ID"
                        )}
                      </p>

                      <p>
                        Batas pengambilan:{" "}
                        {new Date(request.batas_ambil).toLocaleString(
                          "id-ID"
                        )}
                      </p>
                    </div>

                    {/* TOMBOL ACTION */}
                    <AntreanActions
                      loanId={request.id}
                      kodePinjam={request.kode_pinjam}
                    />
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