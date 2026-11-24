"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  { label: "Dashboard", href: "/pegawai" },
  { label: "Antrean", href: "/pegawai/antrean" },
  { label: "Sirkulasi", href: "/pegawai/sirkulasi" },
  { label: "Pengajuan Perpanjangan", href: "/pegawai/pengajuan-perpanjangan" },
  { label: "Pengelolaan Denda", href: "/pegawai/denda" },
  { label: "Kelola Buku", href: "/pegawai/buku" },
  { label: "Pengambilan", href: "/pegawai/pengambilan" },
  { label: "Pengembalian", href: "/pegawai/pengembalian" },
  { label: "Pengumuman", href: "/pegawai/pengumuman" },
];

export default function PegawaiSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href) => {
    if (href === "/pegawai") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal.");
      }

      setOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* MOBILE HEADER */}
      <header className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between border-b border-[#211C45] bg-[#14112B] px-5 py-4 lg:hidden">
        <div>
          <h1 className="text-xl font-black text-[#F5F0E8]">
            BOOKLYN.
          </h1>

          <p className="text-xs text-[#F5B544]">
            Pegawai
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#211C45] text-2xl text-[#F5B544]"
        >
          ☰
        </button>
      </header>

      {/* MOBILE OVERLAY */}
      {open && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[65] bg-black/60 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex h-screen w-[280px] flex-col border-r border-white/10 bg-[#211C45] p-5 transition-transform duration-300 lg:w-[280px] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="mb-8 flex shrink-0 items-start justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-wide text-[#F5F0E8]">
              BOOKLYN.
            </h2>

            <span className="mt-2 inline-block rounded-full bg-[#F5B544]/15 px-3 py-1 text-xs font-semibold text-[#F5B544]">
              Pegawai
            </span>
          </div>

          {/* CLOSE BUTTON - MOBILE */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-gray-400 transition hover:bg-[#FF6B8B]/20 hover:text-[#FF6B8B] lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
          {menuItems.map(({ label, href }) => {
            const active = isActive(href);

            return (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  active
                    ? "bg-[#F5B544]/20 font-bold text-[#F5B544]"
                    : "text-[#A6A0C0] hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-sm ${
                    active ? "bg-[#F5B544]" : "bg-white/20"
                  }`}
                />

                {label}
              </a>
            );
          })}
        </nav>

        {/* PROFILE & LOGOUT */}
        <div className="mt-6 shrink-0 border-t border-white/10 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5B544] font-bold text-[#14112B]">
              {user?.nama?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F5F0E8]">
                {user?.nama || "Pegawai"}
              </p>

              <p className="text-xs text-[#A6A0C0]">
                Pegawai
              </p>
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#FF6B8B]/20 bg-[#FF6B8B]/10 px-4 py-3 text-sm font-semibold text-[#FF6B8B] transition hover:bg-[#FF6B8B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>↪</span>
            {loggingOut ? "Keluar..." : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}