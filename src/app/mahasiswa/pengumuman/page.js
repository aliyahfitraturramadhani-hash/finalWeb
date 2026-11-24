import Link from "next/link";
import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";

function formatTanggal(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
}

function getCategoryStyle(kategori) {
  switch (kategori) {
    case "Operational":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "Service":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "Event":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
}

function getCategoryLabel(kategori) {
  switch (kategori) {
    case "Operational":
      return "Operasional";
    case "Service":
      return "Layanan";
    case "Event":
      return "Acara";
    default:
      return kategori || "Umum";
  }
}

export default async function PengumumanMahasiswaPage() {
  await getActiveUser("member");

  const pengumuman = await query(
    `
      SELECT
        id,
        judul,
        isi,
        kategori,
        tanggal_rilis,
        published_at,
        created_at
      FROM announcements
      WHERE status = 'published'
        AND (
          tanggal_rilis IS NULL
          OR tanggal_rilis <= CURRENT_DATE
        )
      ORDER BY
        COALESCE(tanggal_rilis, published_at::date, created_at::date) DESC,
        published_at DESC NULLS LAST,
        created_at DESC
    `
  );

  return (
   <div className="min-h-screen w-full min-w-0 space-y-8 bg-[#151229] px-5 py-6 text-[#F5F0E8] md:px-8 md:py-7">
      {/* HEADER */}
      <section>
        <p className="text-sm text-[#FFB82E]">
          Member Center / Pengumuman
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#F5F0E8]">
          Pengumuman
        </h1>

        <p className="mt-2 text-sm text-[#A6A1BC]">
          Informasi terbaru, layanan, dan kegiatan dari perpustakaan BOOKLYN.
        </p>
      </section>

      {/* ANNOUNCEMENT COUNT */}
      <section className="rounded-2xl border border-white/5 bg-[#211D39] p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFB82E]/10 text-2xl">
            📢
          </div>

          <div>
            <p className="text-sm text-[#A6A1BC]">
              Pengumuman aktif
            </p>

            <p className="mt-1 text-2xl font-bold text-[#FFB82E]">
              {pengumuman.length}
            </p>
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENT LIST */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F5F0E8]">
            Informasi Terbaru
          </h2>
        </div>

        {pengumuman.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#211D39] px-6 py-16 text-center">
            <div className="mb-4 text-5xl">📭</div>

            <h3 className="text-lg font-semibold text-[#F5F0E8]">
              Belum ada pengumuman
            </h3>

            <p className="mt-2 text-sm text-[#A6A1BC]">
              Pengumuman terbaru akan muncul di halaman ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pengumuman.map((item) => (
              <article
                key={item.id}
                className="group rounded-2xl border border-white/5 bg-[#211D39] p-5 transition duration-200 hover:border-[#FFB82E]/20 hover:bg-[#292443]"
              >
                {/* TOP */}
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getCategoryStyle(item.kategori)}`}
                  >
                    {getCategoryLabel(item.kategori)}
                  </span>

                  <span className="text-xs text-[#A6A1BC]">
                    {formatTanggal(item.tanggal_rilis || item.published_at || item.created_at)}
                  </span>
                </div>

                {/* TITLE */}
                <h3 className="mt-4 text-lg font-semibold leading-relaxed text-[#F5F0E8] transition group-hover:text-[#FFB82E]">
                  {item.judul}
                </h3>

                {/* CONTENT */}
                <div className="mt-3 whitespace-pre-line text-sm leading-7 text-[#A6A1BC]">
                  {item.isi}
                </div>

                {/* FOOTER */}
                <div className="mt-5 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-[#A6A1BC]">
                      Diterbitkan oleh perpustakaan BOOKLYN
                    </p>

                    <Link
                      href={`/pengumuman/${item.id}`}
                      className="text-xs font-medium text-[#FFB82E] transition hover:text-[#FFD16C]"
                    >
                      Baca selengkapnya ↗
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}