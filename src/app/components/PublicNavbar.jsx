"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function PublicNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href) => pathname === href;

  const linkClass = (href) =>
    `transition duration-200 ${
      isActive(href)
        ? "text-[#D6AA65]"
        : "text-white/70 hover:text-[#D6AA65]"
    }`;

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/15 bg-[#351923]/40 px-6 py-5 shadow-lg shadow-black/5 backdrop-blur-2xl backdrop-saturate-150 md:px-16">
      <div className="flex items-center justify-between">

        {/* LOGO */}
        <Link
          href="/"
          onClick={closeMenu}
          className="font-serif text-2xl tracking-widest"
        >
          BOOKLYN<span className="text-[#D6AA65]">.</span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden items-center gap-10 text-sm md:flex">

          <Link href="/" className={linkClass("/")}>
            Home
          </Link>

          <Link href="/katalog" className={linkClass("/katalog")}>
            Collection
          </Link>

          <Link
            href="/#categories"
            className="text-white/70 transition hover:text-[#D6AA65]"
          >
            Categories
          </Link>

          <Link
            href="/#about"
            className="text-white/70 transition hover:text-[#D6AA65]"
          >
            About
          </Link>

          <Link
            href="/pengumuman"
            className={
              pathname.startsWith("/pengumuman")
                ? "text-[#D6AA65]"
                : "text-white/70 transition hover:text-[#D6AA65]"
            }
          >
            Announcements
          </Link>

        </div>

        {/* DESKTOP SIGN IN */}
        <Link
          href="/login"
          className="hidden rounded-full border border-white/30 px-5 py-2 text-sm transition hover:border-[#D6AA65] hover:bg-[#D6AA65] hover:text-[#351923] md:block"
        >
          Sign In
        </Link>

        {/* MOBILE BUTTON */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-[#D6AA65] hover:text-[#D6AA65] md:hidden"
        >
          <span className="text-2xl leading-none">
            {menuOpen ? "×" : "☰"}
          </span>
        </button>

      </div>

      {/* MOBILE MENU */}
      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          menuOpen
            ? "mt-5 max-h-96 border-t border-white/10 pt-4 opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 text-sm text-white/75">

          <Link
            href="/"
            onClick={closeMenu}
            className={`rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65] ${
              isActive("/") ? "text-[#D6AA65]" : ""
            }`}
          >
            Home
          </Link>

          <Link
            href="/katalog"
            onClick={closeMenu}
            className={`rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65] ${
              isActive("/katalog") ? "text-[#D6AA65]" : ""
            }`}
          >
            Collection
          </Link>

          <Link
            href="/#categories"
            onClick={closeMenu}
            className="rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65]"
          >
            Categories
          </Link>

          <Link
            href="/#about"
            onClick={closeMenu}
            className="rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65]"
          >
            About
          </Link>

          <Link
            href="/pengumuman"
            onClick={closeMenu}
            className={`rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65] ${
              pathname.startsWith("/pengumuman")
                ? "text-[#D6AA65]"
                : ""
            }`}
          >
            Announcements
          </Link>

          <Link
            href="/login"
            onClick={closeMenu}
            className="mt-2 rounded-lg border border-[#D6AA65]/50 px-4 py-3 text-center text-[#D6AA65] transition hover:bg-[#D6AA65] hover:text-[#351923]"
          >
            Sign In
          </Link>

        </div>
      </div>

    </nav>
  );
}