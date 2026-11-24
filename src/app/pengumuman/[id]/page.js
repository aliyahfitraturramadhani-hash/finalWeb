import Link from "next/link";
import { notFound } from "next/navigation";

import PublicNavbar from "../../components/PublicNavbar";

import {
  formatTanggalID,
  getAnnouncementCategoryLabel,
  getPublishedAnnouncementById,
} from "@/lib/announcements";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;

  const item = await getPublishedAnnouncementById(id);

  return {
    title: item ? `${item.judul} | BOOKLYN` : "Pengumuman | BOOKLYN",
  };
}

export default async function PengumumanDetailPage({ params }) {
  const { id } = await params;

  const item = await getPublishedAnnouncementById(id);

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#351923] text-[#F5F0E8]">

      {/* NAVBAR */}
      <PublicNavbar />

      {/* CONTENT */}
      <article className="relative px-6 pb-28 pt-40 md:px-16">

        <div className="pointer-events-none absolute left-[-150px] top-20 h-96 w-96 rounded-full bg-[#8E4859]/20 blur-[120px]" />

        <div className="pointer-events-none absolute bottom-10 right-[-100px] h-96 w-96 rounded-full bg-[#D6AA65]/10 blur-[120px]" />

        <div className="relative mx-auto max-w-3xl">

          {/* BACK */}
          <Link
            href="/pengumuman"
            className="text-sm text-white/50 transition hover:text-[#D6AA65]"
          >
            ← All announcements
          </Link>

          {/* META */}
          <div className="mt-10 flex flex-wrap items-center gap-4">

            <span className="rounded-full border border-[#D6AA65]/40 px-3 py-1 text-[10px] uppercase tracking-widest text-[#D6AA65]">
              {getAnnouncementCategoryLabel(item.kategori)}
            </span>

            <span className="text-xs text-white/40">
              Diterbitkan {formatTanggalID(item.tanggal)}
            </span>

          </div>

          {/* TITLE */}
          <h1 className="mt-6 font-serif text-4xl leading-tight md:text-6xl">
            {item.judul}
          </h1>

          {/* CONTENT */}
          <div className="mt-10 whitespace-pre-line border-t border-white/10 pt-10 text-base leading-8 text-white/70">
            {item.isi}
          </div>

          {/* FOOTER INFO */}
          <p className="mt-12 border-t border-white/10 pt-6 text-xs text-white/40">
            Diterbitkan oleh perpustakaan BOOKLYN
          </p>

        </div>

      </article>

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