import { getPengajuanPerpanjangan } from "@/lib/pegawai/pengajuan-perpanjangan";
import PengajuanPerpanjanganActions from "./PengajuanPerpanjanganActions";

export default async function PengajuanPerpanjanganPage() {
  const pengajuan = await getPengajuanPerpanjangan();

  const pending = pengajuan.filter((item) => item.status === "pending");
  const approved = pengajuan.filter((item) => item.status === "approved");
  const rejected = pengajuan.filter((item) => item.status === "rejected");

  return (
    <div className="min-h-screen p-6 text-[#F5F0E8] md:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-[#F0B35B]">
          MANAJEMEN PEMINJAMAN
        </p>

        <h1 className="text-3xl font-bold md:text-4xl">
          Pengajuan Perpanjangan
        </h1>

        <p className="mt-2 text-sm text-[#A9A4C4]">
          Kelola permohonan perpanjangan masa peminjaman buku mahasiswa.
        </p>
      </div>

      {/* Statistik */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Menunggu Keputusan"
          value={pending.length}
          color="text-[#F0B35B]"
        />

        <StatCard
          title="Disetujui"
          value={approved.length}
          color="text-emerald-400"
        />

        <StatCard
          title="Ditolak"
          value={rejected.length}
          color="text-rose-400"
        />
      </div>

      {/* Daftar Pengajuan */}
      <div className="rounded-2xl border border-white/10 bg-[#211C42] p-5 md:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Daftar Pengajuan</h2>

            <p className="mt-1 text-sm text-[#A9A4C4]">
              {pengajuan.length} pengajuan tercatat
            </p>
          </div>
        </div>

        {pengajuan.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
            <p className="text-lg font-medium">Belum ada pengajuan</p>

            <p className="mt-2 text-sm text-[#A9A4C4]">
              Pengajuan perpanjangan dari mahasiswa akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pengajuan.map((item) => (
              <PengajuanCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#211C42] p-5">
      <p className="text-sm text-[#A9A4C4]">{title}</p>

      <p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function PengajuanCard({ item }) {
  const statusStyle = {
    pending: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    approved: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    rejected: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  };

  const statusLabel = {
    pending: "Menunggu Keputusan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Makassar",
    });
  }

  function formatDateTime(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar",
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#181432] p-5">
      {/* Bagian Atas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#F0B35B]">
            {item.kode_pinjam || `Peminjaman #${item.loan_id}`}
          </p>

          <h3 className="mt-2 text-lg font-semibold">
            {item.nama_mahasiswa || "Mahasiswa"}
          </h3>

          <p className="text-sm text-[#A9A4C4]">{item.email || "-"}</p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1.5 text-xs font-medium ${
            statusStyle[item.status] || ""
          }`}
        >
          {statusLabel[item.status] || item.status}
        </span>
      </div>

      {/* Buku */}
      <div className="mt-5 rounded-lg bg-white/[0.03] p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#A9A4C4]">
          Buku yang dipinjam
        </p>

        <p className="font-medium">
          {item.judul_buku || "Judul buku tidak tersedia"}
        </p>
      </div>

      {/* Tanggal */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-[#A9A4C4]">Jatuh Tempo Sebelumnya</p>

          <p className="mt-1 font-medium">
            {formatDate(item.tanggal_jatuh_tempo_lama)}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#A9A4C4]">Tanggal yang Diajukan</p>

          <p className="mt-1 font-medium text-[#F0B35B]">
            {formatDate(item.tanggal_jatuh_tempo_baru)}
          </p>
        </div>
      </div>

      {/* Alasan */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#A9A4C4]">
          Alasan Pengajuan
        </p>

        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-4 text-sm leading-relaxed">
          {item.alasan}
        </div>
      </div>

      {/* Waktu */}
      <p className="mt-4 text-xs text-[#8F89AF]">
        Diajukan pada: {formatDateTime(item.requested_at)}
      </p>

      {/* Catatan Petugas */}
      {item.catatan_petugas && (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.03] p-4">
          <p className="mb-1 text-xs font-medium text-[#A9A4C4]">
            Catatan Petugas
          </p>

          <p className="text-sm">{item.catatan_petugas}</p>
        </div>
      )}

      {/* Aksi Pengajuan */}
      {item.status === "pending" && (
        <PengajuanPerpanjanganActions requestId={item.id} />
      )}
    </div>
  );
}