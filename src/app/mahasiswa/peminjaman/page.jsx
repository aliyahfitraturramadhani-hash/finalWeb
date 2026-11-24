import { getPeminjamanMahasiswa } from "@/lib/mahasiswa/peminjaman";
import PeminjamanFilter from "./PeminjamanFilter";

export const dynamic = "force-dynamic";

// =========================================
// HALAMAN PEMINJAMAN
// =========================================

export default async function PeminjamanPage() {
  const peminjaman = await getPeminjamanMahasiswa();

  // =========================================
  // STATISTIK
  // =========================================

  const totalPeminjaman = peminjaman.length;

  const menungguKonfirmasi = peminjaman.filter(
    (item) => item.status === "menunggu_konfirmasi"
  ).length;

  const sedangDipinjam = peminjaman.filter(
    (item) => item.status === "sedang_dipinjam"
  ).length;

  return (
    <div className="min-h-screen space-y-7 bg-[#151229] p-5 text-[#F5F0E8] md:p-7">

      {/* =========================================
          HEADER
      ========================================= */}

      <section>

        <p className="text-sm font-medium text-[#A6A1BC]">
          Member Area / Peminjaman Saya
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Peminjaman Saya
        </h1>

        <p className="mt-2 text-sm text-[#A6A1BC]">
          Pantau status peminjaman dan buku yang sedang kamu pinjam.
        </p>

      </section>

      {/* =========================================
          STATISTIK
      ========================================= */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <StatCard
          title="Total Peminjaman"
          value={totalPeminjaman}
          color="text-[#FFB82E]"
          icon="▤"
        />

        <StatCard
          title="Menunggu Konfirmasi"
          value={menungguKonfirmasi}
          color="text-[#FFB82E]"
          icon="◷"
        />

        <StatCard
          title="Sedang Dipinjam"
          value={sedangDipinjam}
          color="text-[#4DA3FF]"
          icon="↗"
        />

      </section>

      {/* =========================================
          DAFTAR PEMINJAMAN
      ========================================= */}

      <section>

        <div className="mb-5">

          <h2 className="text-lg font-bold">
            Daftar Peminjaman
          </h2>

          <p className="mt-1 text-sm text-[#A6A1BC]">
            Berikut adalah seluruh transaksi peminjaman buku kamu.
          </p>

        </div>

        <PeminjamanFilter peminjaman={peminjaman} />

      </section>

    </div>
  );
}

// =========================================
// KOMPONEN STATISTIK
// =========================================

function StatCard({ title, value, color, icon }) {
  return (

    <div className="rounded-2xl border border-white/5 bg-[#211D39] px-5 py-4 transition hover:bg-[#292443]">

      <div className="flex items-center justify-between">

        <p className="text-sm text-[#A6A1BC]">
          {title}
        </p>

        <span className={`text-xl ${color}`}>
          {icon}
        </span>

      </div>

      <h3 className={`mt-2 text-2xl font-bold ${color}`}>
        {value}
      </h3>

    </div>

  );
}