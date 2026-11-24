import Link from "next/link";
import PublicNavbar from "../components/PublicNavbar";

import {
  formatTanggalID,
  getAnnouncementCategoryLabel,
  getPublishedAnnouncements,
} from "@/lib/announcements";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengumuman | BOOKLYN",
};

export default async function PengumumanPublikPage() {
  const announcements = await getPublishedAnnouncements();

  return (
    <main className="min-h-screen bg-[#351923] text-[#F5F0E8]">

      {/* NAVBAR */}
      <PublicNavbar />

      {/* HEADER */}
      <section className="relative px-6 pb-12 pt-40 md:px-16">

        <div className="pointer-events-none absolute left-[-150px] top-20 h-96 w-96 rounded-full bg-[#8E4859]/20 blur-[120px]" />

        <p className="relative mb-5 text-xs uppercase tracking-[0.4em] text-[#D6AA65]">
          Library notice board
        </p>

        <h1 className="relative font-serif text-5xl leading-[1.05] md:text-7xl">
          Latest{" "}
          <span className="italic text-[#D6AA65]">
            announcements.
          </span>
        </h1>

        <p className="relative mt-6 max-w-lg text-sm leading-7 text-white/60">
          Operational notices, service schedules, and library events.
        </p>

      </section>

      {/* LIST */}
      <section className="px-6 pb-28 md:px-16">

        {announcements.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-20 text-center">

            <p className="font-serif text-3xl italic">
              No announcements yet.
            </p>

            <p className="mt-4 text-sm text-white/50">
              New announcements will appear here.
            </p>

          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {announcements.map((item) => (
              <Link
                key={item.id}
                href={`/pengumuman/${item.id}`}
                className="group flex flex-col rounded-xl border border-white/10 bg-white/5 p-7 transition duration-300 hover:-translate-y-2 hover:border-[#D6AA65]/50 hover:bg-white/10"
              >

                <div className="flex items-center justify-between gap-3">

                  <span className="rounded-full border border-[#D6AA65]/40 px-3 py-1 text-[10px] uppercase tracking-widest text-[#D6AA65]">
                    {getAnnouncementCategoryLabel(item.kategori)}
                  </span>

                  <span className="text-xs text-white/40">
                    {formatTanggalID(item.tanggal)}
                  </span>

                </div>

                <h2 className="mt-8 font-serif text-2xl leading-snug">
                  {item.judul}
                </h2>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/50">
                  {item.isi}
                </p>

                <div className="mt-8 text-right text-[#D6AA65] transition group-hover:translate-x-2">
                  ↗
                </div>

              </Link>
            ))}

          </div>
        )}

      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8 md:px-16">

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/40 md:flex-row">

          <p className="font-serif text-xl tracking-widest text-[#F5F0E8]">
            BOOKLYN.
          </p>

          <p>
            A little corner for every story.
          </p>

          <p>
            © 2026 BOOKLYN. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}