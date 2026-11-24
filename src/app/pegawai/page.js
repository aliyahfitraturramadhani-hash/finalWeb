import { getPegawaiDashboardData } from "@/app/actions/pegawai-dashboard";

export default async function PegawaiPage() {
  const { stats, queue, extensions } = await getPegawaiDashboardData();

  const statCards = [
    {
      title: "Antrean Pinjam",
      value: stats.antrean_pinjam,
      color: "#F5B544",
      subtitle: "Menunggu verifikasi",
    },
    {
      title: "Sedang Dipinjam",
      value: stats.sedang_dipinjam,
      color: "#38A4FF",
      subtitle: "Buku dalam sirkulasi",
    },
    {
      title: "Jatuh Tempo Hari Ini",
      value: stats.jatuh_tempo_hari_ini,
      color: "#A78BFA",
      subtitle: "Perlu diperhatikan",
    },
    {
      title: "Denda Tertunggak",
      value: `Rp${Number(stats.denda_tertunggak).toLocaleString("id-ID")}`,
      color: "#FF5C87",
      subtitle: "Belum diselesaikan",
    },
  ];

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";

  return (
    <div className="min-h-screen bg-[#14112B] text-[#F5F0E8]">
      {/* HEADER */}
      <header className="border-b border-white/10 px-5 py-6 md:px-10">
        <p className="text-xs font-bold tracking-widest text-[#F5B544]">
          DASHBOARD / PEGAWAI
        </p>

        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          Dashboard Pegawai
        </h1>

        <p className="mt-2 text-sm text-[#A6A0C0]">
          Kelola aktivitas perpustakaan hari ini.
        </p>
      </header>

      <section className="space-y-6 p-5 md:p-8">
        {/* STATISTIK */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className="rounded-2xl border border-white/5 bg-[#211C45]/80 p-5"
            >
              <p className="text-sm text-[#A6A0C0]">{stat.title}</p>

              <h2
                className="mt-3 text-3xl font-black"
                style={{ color: stat.color }}
              >
                {stat.value}
              </h2>

              <p className="mt-2 text-xs text-[#A6A0C0]">
                {stat.subtitle}
              </p>

              <div
                className="mt-4 h-1 rounded-full"
                style={{ backgroundColor: `${stat.color}50` }}
              >
                <div
                  className="h-1 w-2/3 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ANTREAN VERIFIKASI */}
        <div className="rounded-2xl border border-white/10 bg-[#211C45]/60 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              Antrean Verifikasi Peminjaman
            </h2>

            <span className="rounded-full bg-[#F5B544]/15 px-3 py-1 text-xs font-bold text-[#F5B544]">
              {stats.antrean_pinjam} Menunggu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="text-xs uppercase text-[#A6A0C0]">
                <tr>
                  <th className="pb-4">Mahasiswa</th>
                  <th className="pb-4">Buku</th>
                  <th className="pb-4">Diajukan</th>
                  <th className="pb-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {queue.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-[#A6A0C0]"
                    >
                      Tidak ada antrean peminjaman.
                    </td>
                  </tr>
                ) : (
                  queue.map((loan) => (
                    <tr
                      key={loan.id}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="py-4">{loan.nama_mahasiswa}</td>
                      <td className="py-4">{loan.daftar_buku}</td>

                      <td className="py-4 text-xs text-[#A6A0C0]">
                        {new Date(loan.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-4">
                        <div className="flex justify-center gap-2">
                          <button className="rounded-full bg-[#2CC6A5] px-3 py-1.5 text-xs font-bold text-[#14112B]">
                            Approve
                          </button>

                          <button className="rounded-full border border-[#FF5C87] px-3 py-1.5 text-xs font-bold text-[#FF5C87]">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PINTASAN */}
        <div>
          <h2 className="mb-4 text-lg font-bold">Pintasan</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Kelola Buku",
                desc: "Kelola koleksi dan eksemplar",
                href: "/pegawai/buku",
                color: "#38A4FF",
              },
              {
                title: "Kelola Pengumuman",
                desc: "Informasi perpustakaan",
                href: "/pegawai/pengumuman",
                color: "#F5B544",
              },
              {
                title: "Antrean Perpanjangan",
                desc: "Validasi permintaan",
                href: "/pegawai/pengajuan-perpanjangan",
                color: "#A78BFA",
              },
            ].map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="group rounded-2xl border p-5 transition hover:-translate-y-1 hover:bg-white/5"
                style={{ borderColor: `${card.color}70` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{card.title}</h3>
                    <p className="mt-2 text-xs text-[#A6A0C0]">
                      {card.desc}
                    </p>
                  </div>

                  <div
                    className="h-12 w-12 rounded-full"
                    style={{ backgroundColor: `${card.color}40` }}
                  />
                </div>

                <p
                  className="mt-5 text-sm font-bold"
                  style={{ color: card.color }}
                >
                  Buka →
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* ANTREAN PERPANJANGAN */}
        <div className="rounded-2xl border border-white/10 bg-[#211C45]/60 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              Perpanjangan Menunggu Validasi
            </h2>

            <span className="rounded-full bg-[#A78BFA]/15 px-3 py-1 text-xs font-bold text-[#A78BFA]">
              {extensions.length} Menunggu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="text-xs uppercase text-[#A6A0C0]">
                <tr>
                  <th className="pb-4">Mahasiswa</th>
                  <th className="pb-4">Buku</th>
                  <th className="pb-4">Jatuh Tempo Baru</th>
                  <th className="pb-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {extensions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-[#A6A0C0]"
                    >
                      Tidak ada permintaan perpanjangan.
                    </td>
                  </tr>
                ) : (
                  extensions.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="py-4">{item.nama_mahasiswa}</td>
                      <td className="py-4">{item.daftar_buku}</td>
                      <td className="py-4">
                        {formatDate(item.tanggal_jatuh_tempo_baru)}
                      </td>

                      <td className="py-4">
                        <div className="flex justify-center gap-2">
                          <button className="rounded-full bg-[#2CC6A5] px-3 py-1.5 text-xs font-bold text-[#14112B]">
                            Setujui
                          </button>

                          <button className="rounded-full border border-[#FF5C87] px-3 py-1.5 text-xs font-bold text-[#FF5C87]">
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}