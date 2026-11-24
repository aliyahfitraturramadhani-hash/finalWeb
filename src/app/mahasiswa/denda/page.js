import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatTanggal(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
}

function getStatusLabel(status) {
  switch (status) {
    case "belum_dibayar":
    case "tertunggak":
      return "Belum Dibayar";
    case "lunas":
      return "Lunas";
    case "dihapuskan":
      return "Dihapuskan";
    default:
      return status;
  }
}

function getStatusStyle(status) {
  switch (status) {
    case "belum_dibayar":
    case "tertunggak":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "lunas":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "dihapuskan":
      return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
}

function StatCard({ title, value, description, icon, accent }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#211D39] p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-[#A6A1BC]">{title}</p>

          <h2 className={`mt-3 text-2xl font-bold ${accent}`}>
            {value}
          </h2>

          <p className="mt-2 text-xs text-[#A6A1BC]">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function DendaMahasiswaPage() {
  const user = await getActiveUser("member");

  const result = await query(
    `
      SELECT
        f.id AS fine_id,
        f.jenis,
        f.hari_terlambat,
        f.tarif_per_hari,
        f.jumlah_denda,
        f.status AS status_denda,
        f.alasan_penghapusan,
        f.dibayar_at,
        f.created_at,

        l.kode_pinjam,
        l.id AS loan_id,

        li.id AS loan_item_id,
        li.tanggal_kembali,

        b.id AS book_id,
        b.judul,
        b.penulis,
        b.sampul

      FROM fines f

      JOIN loan_items li
        ON li.id = f.loan_item_id

      JOIN loans l
        ON l.id = li.loan_id

      JOIN members m
        ON m.id = l.member_id

      JOIN book_copies bc
        ON bc.id = li.copy_id

      JOIN books b
        ON b.id = bc.book_id

      WHERE m.user_id = $1

      ORDER BY f.created_at DESC, f.id DESC
    `,
    [user.id]
  );

  const denda = result;

  const belumDibayar = denda.filter((item) =>
    ["belum_dibayar", "tertunggak"].includes(item.status_denda)
  );

  const sudahLunas = denda.filter(
    (item) => item.status_denda === "lunas"
  );

  const totalBelumDibayar = belumDibayar.reduce(
    (total, item) => total + Number(item.jumlah_denda || 0),
    0
  );

  const totalLunas = sudahLunas.reduce(
    (total, item) => total + Number(item.jumlah_denda || 0),
    0
  );

  return (
    <div className="min-h-screen w-full min-w-0 space-y-8 bg-[#151229] px-5 py-6 text-[#F5F0E8] md:px-8 md:py-7">

      {/* HEADER */}
      <section>
        <p className="text-sm text-[#FFB82E]">
          Member Center / Denda
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#F5F0E8]">
          Denda Saya
        </h1>

        <p className="mt-2 text-sm text-[#A6A1BC]">
          Pantau tagihan dan riwayat denda peminjaman buku kamu.
        </p>
      </section>

      {/* STATISTICS */}
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Belum Dibayar"
          value={formatRupiah(totalBelumDibayar)}
          description={`${belumDibayar.length} tagihan belum diselesaikan`}
          icon="⚠️"
          accent="text-red-400"
        />

        <StatCard
          title="Total Denda Lunas"
          value={formatRupiah(totalLunas)}
          description={`${sudahLunas.length} tagihan telah dibayar`}
          icon="✓"
          accent="text-green-400"
        />
      </section>

      {/* REMINDER */}
      {belumDibayar.length > 0 && (
        <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex gap-4">
            <div className="text-2xl">⚠️</div>

            <div>
              <h3 className="font-semibold text-red-400">
                Kamu memiliki denda yang belum diselesaikan
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-[#A6A1BC]">
                Terdapat {belumDibayar.length} tagihan dengan total{" "}
                <span className="font-semibold text-red-400">
                  {formatRupiah(totalBelumDibayar)}
                </span>
                . Silakan hubungi petugas perpustakaan untuk
                informasi penyelesaian pembayaran.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* FINE HISTORY */}
      <section className="overflow-hidden rounded-2xl border border-white/5 bg-[#211D39]">
        <div className="border-b border-white/5 p-5">
          <h2 className="text-lg font-semibold text-[#F5F0E8]">
            Riwayat Denda
          </h2>

          <p className="mt-1 text-sm text-[#A6A1BC]">
            Daftar denda dari seluruh peminjaman kamu.
          </p>
        </div>

        {denda.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mb-4 text-5xl">🎉</div>

            <h3 className="text-lg font-semibold text-[#F5F0E8]">
              Tidak ada denda
            </h3>

            <p className="mt-2 text-sm text-[#A6A1BC]">
              Kamu belum memiliki catatan denda peminjaman.
            </p>

            <Link
              href="/mahasiswa/peminjaman"
              className="mt-5 inline-flex rounded-xl bg-[#FFB82E] px-5 py-2.5 text-sm font-semibold text-[#151229] transition hover:bg-yellow-400"
            >
              Lihat Peminjaman
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {denda.map((item) => (
              <div
                key={item.fine_id}
                className="p-5 transition hover:bg-white/[0.02]"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                  {/* BOOK INFO */}
                  <div className="flex min-w-0 gap-4">
                    {item.sampul ? (
                      <img
                        src={item.sampul}
                        alt={item.judul}
                        className="h-28 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-[#292443] text-2xl">
                        📚
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#F5F0E8]">
                        {item.judul}
                      </h3>

                      <p className="mt-1 text-sm text-[#A6A1BC]">
                        {item.penulis}
                      </p>

                      <p className="mt-3 text-xs text-[#A6A1BC]">
                        Kode Peminjaman
                      </p>

                      <p className="mt-1 break-all font-mono text-sm text-[#FFB82E]">
                        {item.kode_pinjam}
                      </p>

                      <p className="mt-3 text-xs text-[#A6A1BC]">
                        Dicatat: {formatTanggal(item.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* FINE DETAILS */}
                  <div className="flex flex-col gap-3 md:min-w-[220px] md:items-end">
                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(item.status_denda)}`}
                    >
                      {getStatusLabel(item.status_denda)}
                    </span>

                    <p className="text-2xl font-bold text-[#FFB82E]">
                      {formatRupiah(item.jumlah_denda)}
                    </p>

                    <p className="text-sm text-[#A6A1BC]">
                      {item.jenis === "terlambat"
                        ? "Denda keterlambatan"
                        : item.jenis === "rusak"
                          ? "Denda kerusakan buku"
                          : item.jenis === "hilang"
                            ? "Denda kehilangan buku"
                            : item.jenis}
                    </p>
                  </div>
                </div>

                {/* ADDITIONAL DETAILS */}
                <div className="mt-5 grid gap-3 rounded-xl bg-[#151229]/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs text-[#A6A1BC]">
                      Hari keterlambatan
                    </p>

                    <p className="mt-1 font-medium text-[#F5F0E8]">
                      {item.hari_terlambat ?? 0} hari
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#A6A1BC]">
                      Tarif per hari
                    </p>

                    <p className="mt-1 font-medium text-[#F5F0E8]">
                      {item.tarif_per_hari != null
                        ? formatRupiah(item.tarif_per_hari)
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#A6A1BC]">
                      Tanggal pembayaran
                    </p>

                    <p className="mt-1 font-medium text-[#F5F0E8]">
                      {formatTanggal(item.dibayar_at)}
                    </p>
                  </div>
                </div>

                {/* WAIVED FINE */}
                {item.status_denda === "dihapuskan" && (
                  <div className="mt-4 rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">
                    <p className="text-sm font-medium text-purple-300">
                      Denda telah dihapuskan
                    </p>

                    {item.alasan_penghapusan && (
                      <p className="mt-1 text-sm text-[#A6A1BC]">
                        Alasan: {item.alasan_penghapusan}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* INFORMATION */}
      <section className="rounded-2xl border border-white/5 bg-[#211D39] p-5">
        <h3 className="font-semibold text-[#F5F0E8]">
          Informasi Denda
        </h3>

        <div className="mt-3 space-y-2 text-sm leading-relaxed text-[#A6A1BC]">
          <p>
            • Denda dapat dikenakan akibat keterlambatan,
            kerusakan, atau kehilangan buku.
          </p>

          <p>
            • Informasi penyelesaian denda dapat dikonfirmasi
            langsung kepada petugas perpustakaan.
          </p>

          <p>
            • Status denda diperbarui oleh petugas perpustakaan
            setelah proses pembayaran atau penghapusan denda.
          </p>
        </div>
      </section>

    </div>
  );
}