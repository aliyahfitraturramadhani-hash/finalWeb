import {
  getLoansWaitingPickup,
  getLoanRequestDetails,
} from "@/app/actions/pegawai-antrean";

import PickupActions from "./PickupActions";

export default async function PengambilanPage() {
  const requests = await getLoansWaitingPickup();

  return (
    <main className="min-h-screen bg-[#100f24] p-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <header>
          <p className="text-sm font-semibold tracking-[0.25em] text-[#f5b63f]">
            BOOKLYN LIBRARY
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Book Pickup
          </h1>

          <p className="mt-2 text-gray-400">
            Kelola pengambilan buku dan proses serah-terima kepada mahasiswa.
          </p>
        </header>

        {/* STATISTIK */}
        <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#211e3b] p-6">
            <p className="text-sm text-gray-400">
              Menunggu Pengambilan
            </p>

            <h2 className="mt-3 text-4xl font-bold text-[#f5b63f]">
              {requests.length}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Pengajuan telah disetujui pegawai.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#211e3b] p-6">
            <p className="text-sm text-gray-400">
              Status Proses
            </p>

            <h2 className="mt-3 text-xl font-bold text-white">
              Serah-Terima
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Buku menunggu diambil mahasiswa.
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
              Meja pengambilan buku.
            </p>
          </div>
        </section>

        {/* DAFTAR PENGAMBILAN */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">
                Daftar Pengambilan
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Daftar mahasiswa yang perlu mengambil buku.
              </p>
            </div>

            <span className="rounded-full border border-[#f5b63f]/30 bg-[#f5b63f]/10 px-4 py-2 text-sm text-[#f5b63f]">
              {requests.length} Pengajuan
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#211e3b] p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5b63f]/10 text-3xl">
                📚
              </div>

              <h3 className="text-lg font-semibold">
                Tidak Ada Pengambilan
              </h3>

              <p className="mt-2 text-gray-400">
                Belum ada pengajuan yang menunggu pengambilan buku.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map(async (request) => {
                const books = await getLoanRequestDetails(request.id);

                return (
                  <article
                    key={request.id}
                    className="rounded-2xl border border-white/10 bg-[#211e3b] p-6 transition hover:border-[#f5b63f]/30"
                  >
                    {/* IDENTITAS */}
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

                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                        Menunggu Pengambilan
                      </span>
                    </div>

                    {/* DETAIL BUKU */}
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <p className="mb-3 font-semibold">
                        Buku yang akan diambil ({books.length})
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

                    {/* INFORMASI WAKTU */}
                    <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-400">
                      <p>
                        Pengajuan:{" "}
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

                    {/* INFORMASI SERAH TERIMA */}
                    <div className="mt-6 rounded-xl border border-[#f5b63f]/10 bg-[#f5b63f]/5 p-4">
                      <p className="font-semibold text-[#f5b63f]">
                        Informasi Serah-Terima
                      </p>

                      <p className="mt-2 text-sm leading-relaxed text-gray-400">
                        Pastikan mahasiswa yang mengambil buku sesuai
                        dengan identitas anggota dan buku yang tercantum
                        dalam pengajuan sebelum serah-terima diproses.
                      </p>
                    </div>

                    {/* ACTION */}
                    <div className="mt-6">
                      <PickupActions
                        loanId={request.id}
                        kodePinjam={request.kode_pinjam}
                      />
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