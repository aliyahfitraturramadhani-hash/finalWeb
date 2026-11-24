"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  { label: "Dashboard", href: "/mahasiswa", icon: "▦" },
  { label: "Katalog", href: "/mahasiswa/katalog", icon: "▤" },
  { label: "Peminjaman Saya", href: "/mahasiswa/peminjaman", icon: "⇄" },
  { label: "Reservasi Saya", href: "/mahasiswa/reservasi", icon: "⌛" },
  { label: "Riwayat", href: "/mahasiswa/riwayat", icon: "◷" },
  { label: "Denda", href: "/mahasiswa/denda", icon: "¤" },
  { label: "Pengumuman", href: "/mahasiswa/pengumuman", icon: "▣" },
  { label: "Notifikasi", href: "/mahasiswa/notifikasi", icon: "♧" },
  { label: "Profil", href: "/mahasiswa/profil", icon: "◉" },
];

export default function MahasiswaLayoutClient({ children, user }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const nama = user?.nama || "Mahasiswa";
  const inisial = nama.trim().charAt(0).toUpperCase() || "M";

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Gagal melakukan logout.");
      }

      setSidebarOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout gagal. Silakan coba kembali.");
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#151229] text-[#F5F0E8]">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#151229] text-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >

        {/* LOGO */}
        <div className="relative flex h-20 shrink-0 flex-col justify-center border-b border-white/10 px-6">

          <Link
            href="/mahasiswa"
            onClick={() => setSidebarOpen(false)}
          >
            <h1 className="text-2xl font-bold tracking-wide">
              BOOKLYN<span className="text-[#FFB82E]">.</span>
            </h1>
          </Link>

          <span className="mt-3 inline-block w-fit rounded-full bg-[#27416B] px-3 py-1 text-xs font-medium text-[#70B8FF]">
            Mahasiswa
          </span>

          {/* CLOSE BUTTON */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-lg text-xl text-white/70 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>

        </div>

        {/* NAVIGATION */}
        <nav className="mahasiswa-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">

          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            Menu
          </p>

          <div className="space-y-2">

            {menuItems.map((item) => {

              const active =
                pathname === item.href ||
                (
                  item.href !== "/mahasiswa" &&
                  pathname.startsWith(item.href + "/")
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                    active
                      ? "bg-[#293B61] text-[#4DA3FF]"
                      : "text-[#A6A1BC] hover:bg-white/5 hover:text-white"
                  }`}
                >

                  <span className="flex w-6 items-center justify-center text-lg">
                    {item.icon}
                  </span>

                  <span className="text-sm font-medium">
                    {item.label}
                  </span>

                </Link>
              );

            })}

          </div>

        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="border-t border-white/10 p-4">

          {/* ACCOUNT INFO */}
          <div className="flex items-center gap-3 rounded-xl p-3">

            {/* AVATAR */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4DA3FF] font-bold text-[#151229]">
              {inisial}
            </div>

            {/* USER NAME */}
            <div className="min-w-0">

              <p className="truncate text-sm font-semibold text-white">
                {nama}
              </p>

              <p className="text-xs text-white/50">
                Mahasiswa
              </p>

            </div>

          </div>

          {/* LOGOUT BUTTON */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <span className="flex w-6 items-center justify-center text-lg">
              ⇥
            </span>

            <span>
              {loggingOut ? "Logging out..." : "Logout"}
            </span>

          </button>

        </div>

      </aside>

      {/* MAIN AREA */}
      <div className="min-h-screen min-w-0 md:ml-64">

        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-20 w-full items-center border-b border-white/10 bg-[#151229]/95 px-5 text-white backdrop-blur md:px-8">

          {/* HEADER TITLE */}
          <div className="flex items-center gap-4">

            {/* HAMBURGER */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#211D39] text-white md:hidden"
              aria-label="Open navigation"
            >
              <span className="text-xl">☰</span>
            </button>

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-[#827A9B]">
                Member Center <span className="mx-1">|</span> Mahasiswa
              </p>

              <h2 className="text-xl font-bold text-[#F5F0E8]">
                Dashboard Mahasiswa
              </h2>

            </div>

          </div>

        </header>

        {/* CONTENT AREA */}
        <main className="relative w-full min-w-0 bg-[#151229]">
          {children}
        </main>

      </div>

    </div>
  );
}