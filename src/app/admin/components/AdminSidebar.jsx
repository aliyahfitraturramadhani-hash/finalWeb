"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const menuItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Pengguna", href: "/admin/pengguna" },
  { label: "Kategori", href: "/admin/kategori" },
  { label: "Buku", href: "/admin/buku" },
  { label: "Pengumuman", href: "/admin/pengumuman" },
  { label: "Log Transaksi", href: "/admin/transaksi" },
  { label: "Sirkulasi", href: "/admin/sirkulasi" },
  { label: "Laporan", href: "/admin/laporan" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const activeColor =
    pathname === "/admin/kategori"
      ? "bg-[#4DA3FF]"
      : "bg-[#FF6B8B]";

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

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

      setOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout gagal. Silakan coba kembali.");
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* HAMBURGER BUTTON - MOBILE */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka navigasi"
        aria-expanded={open}
        className="fixed right-5 top-5 z-50 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#211C45] text-white shadow-lg md:hidden"
      >
        <span className="text-2xl">☰</span>
      </button>

      {/* MOBILE OVERLAY */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${
          open
            ? "visible opacity-100"
            : "invisible opacity-0"
        }`}
      />

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72
          flex-col border-r border-white/10 bg-[#211C45]
          p-6 shadow-2xl transition-transform duration-300
          md:sticky md:top-0 md:z-20 md:h-screen md:w-64
          md:translate-x-0 md:shadow-none
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* LOGO */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <Link href="/admin" onClick={() => setOpen(false)}>
              <h1 className="text-2xl font-bold tracking-widest">
                BOOKLYN<span className="text-[#FF6B8B]">.</span>
              </h1>
            </Link>

            <p className="mt-2 text-sm text-gray-400">
              Administrator
            </p>
          </div>

          {/* CLOSE BUTTON - MOBILE */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup navigasi"
            className="rounded-lg bg-white/10 px-3 py-2 text-gray-300 transition hover:bg-white/20 hover:text-white md:hidden"
          >
            ✕
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-3 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  block rounded-xl p-3 transition
                  ${
                    active
                      ? `${activeColor} font-semibold text-[#211C45]`
                      : "text-gray-300 hover:bg-white/10"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="mb-4">
            <p className="font-medium text-white">
              Admin BOOKLYN
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Library Management
            </p>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg">⇥</span>

            <span>
              {loggingOut ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}