"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { loginAction } from "@/app/actions/auth";

/* =========================================================
   BOOK MASCOT - MENGINTIP
========================================================= */

function BookMascot({ passwordFocused, showPassword }) {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleMouseMove(e) {
      const mascot = document.getElementById("book-mascot");

      if (!mascot) return;

      const rect = mascot.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const maxMove = 4;

      setEyePosition({
        x: Math.max(-maxMove, Math.min(maxMove, deltaX / 35)),
        y: Math.max(-maxMove, Math.min(maxMove, deltaY / 35)),
      });
    }

    window.addEventListener("mousemove", handleMouseMove);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const eyesClosed = passwordFocused && !showPassword;

  return (
    <div
      id="book-mascot"
      className="relative flex h-[92px] w-[76px] items-center justify-center rounded-[20px] bg-[#F5B942] shadow-[inset_9px_0_0_#D99A24]"
    >
      {/* BOOK SPINE */}
      <div className="absolute left-0 top-0 h-full w-[10px] rounded-l-[20px] bg-[#D99A24]" />

      {/* EYES */}
      <div className="absolute top-[33px] flex gap-[9px]">
        {[0, 1].map((eye) => (
          <div
            key={eye}
            className={`relative flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white transition-all duration-200 ${
              eyesClosed ? "h-[3px]" : ""
            }`}
          >
            {!eyesClosed && (
              <div
                className="absolute h-[7px] w-[7px] rounded-full bg-[#17132E] transition-transform duration-100"
                style={{
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                }}
              >
                <div className="absolute right-[1px] top-[1px] h-[2px] w-[2px] rounded-full bg-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MOUTH */}
      {!eyesClosed && (
        <div className="absolute bottom-[20px] h-[11px] w-[25px] rounded-b-full border-b-[2px] border-[#17132E]" />
      )}

      {eyesClosed && (
        <div className="absolute bottom-[23px] h-[3px] w-[16px] rounded-full bg-[#17132E]" />
      )}
    </div>
  );
}

/* =========================================================
   BOOK WALL - REAL COVERS
========================================================= */

const books = [
  {
    title: "A Curse for True Love",
    image: "/images/books/a-curse-for-true-love-stephanie-garber.jpg",
  },
  {
    title: "About You",
    image: "/images/books/about-you-visya-nabila.jpg",
  },
  {
    title: "Bulan",
    image: "/images/books/bulan-tere-liye.jpg",
  },
{
  title: "Bumi",
  image: "/images/books/bumi-tere-liyejpg.jpg",
},
  {
    title: "Doughslove",
    image: "/images/books/doughslove-carlene-ann.jpg",
  },
  {
    title: "Hello, Cello.",
    image: "/images/books/hello-cello-nadia-restivani.jpg",
  },
  {
    title: "High Reputation",
    image: "/images/books/high-reputation-quinn.jpg",
  },
  {
    title: "Kembali ke Batavia",
    image: "/images/books/kembali-ke-batavia-gigrey.jpg",
  },
  {
    title: "Laskar Pelangi",
    image: "/images/books/laskar-pelangi-andrea-hirata.jpg",
  },
  {
    title: "Little Red Riding Hood",
    image: "/images/books/little-red-riding-hood-ruwi-meita.jpg",
  },
  {
    title: "Lotus in the Mud",
    image: "/images/books/lotus-in-the-mud-annelie.jpg",
  },
  {
    title: "Mada",
    image: "/images/books/mada-gigrey.jpg",
  },
  {
    title: "Malioboro at Midnight",
    image: "/images/books/malioboro-at-midnight-skysphiere.jpg",
  },
  {
    title: "Matahari",
    image: "/images/books/matahari-tere-liye.jpg",
  },
  {
    title: "Negeri 5 Menara",
    image: "/images/books/negeri-5-menara-ahmad-fuadi.jpg",
  },
  {
    title: "Once Upon a Broken Heart",
    image: "/images/books/once-upon-a-broken-heart-stephanie-garber.jpg",
  },
  {
    title: "Perahu Kertas",
    image: "/images/books/perahu-kertas-dee-lestari.jpg",
  },
  {
    title: "Surat untuk Jenaka",
    image: "/images/books/surat-untuk-jenaka-gigrey.jpg",
  },
  {
    title: "Teka-Teki Shaka",
    image: "/images/books/teka-teki-shaka-zahira-aulia.jpg",
  },
  {
    title: "The Ballad of Never After",
    image: "/images/books/the-ballad-of-never-after-stephanie-garber.jpg",
  },
  {
    title: "The Hunger Games",
    image: "/images/books/the-hunger-games-suzanne-collins.jpg",
  },
  {
    title: "The Little Prince",
    image: "/images/books/the-little-prince-antoine-de-saint-exupery.jpg",
  },
  {
    title: "The Secret of a Heart Note",
    image: "/images/books/the-secret-of-a-heart-note-stacey-lee.jpg",
  },
  {
    title: "True Colors",
    image: "/images/books/true-colors-gladys-cornelia.jpg",
  },
  {
    title: "Wonder",
    image: "/images/books/wonder-r-j-palacio.jpg",
  },
];

/* =========================================================
   BOOK WALL COMPONENT
========================================================= */

function BookWall() {
  const columns = [[], [], []];

  books.forEach((book, index) => {
    columns[index % 3].push(book);
  });

  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-3 overflow-hidden px-4 sm:gap-5 sm:px-6 lg:gap-6 lg:px-8">
      {columns.map((column, index) => (
        <div
          key={index}
          className={`book-wall-column ${
            index === 1 ? "book-wall-down" : "book-wall-up"
          }`}
        >
          <div className="book-wall-track">
            {[...column, ...column].map((book, bookIndex) => (
              <div
                key={`${book.title}-${bookIndex}`}
                className="book-wall-cover"
              >
                <Image
                  src={book.image}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 30vw, 20vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   LOGIN PAGE
========================================================= */

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  async function handleLogin(formData) {
    setError("");
    setLoading(true);

    try {
      const result = await loginAction(formData);

      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }

      setError("Terjadi kesalahan. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F5EC] p-4 sm:p-8">
      <div className="grid min-h-[850px] w-full max-w-[1450px] overflow-hidden rounded-[28px] bg-[#100D26] shadow-2xl lg:grid-cols-[1.15fr_0.85fr]">

        {/* LEFT PANEL */}
        <section className="relative min-h-[600px] overflow-hidden bg-[#100D26] lg:min-h-[850px]">

          <BookWall />

          {/* OVERLAY */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#100D26]/95 via-[#100D26]/25 to-transparent" />

          {/* TEXT */}
          <div className="absolute bottom-12 left-8 z-20 sm:bottom-16 sm:left-12">
            <p className="max-w-md text-3xl font-bold leading-tight text-[#F5F0E8] sm:text-4xl lg:text-5xl">
              Setiap buku
              <br />
              <span className="text-[#F5B942]">
                punya cerita.
              </span>
            </p>

            <p className="mt-4 max-w-sm text-sm leading-7 text-[#D8D1E4]">
              Once upon a time, every reader found their own
              little corner of stories.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px w-12 bg-[#F5B942]" />

              <span className="text-xs font-semibold tracking-[0.25em] text-[#F5B942]">
                BOOKLYN.
              </span>
            </div>
          </div>

        </section>

        {/* RIGHT PANEL */}
        <section className="flex items-center justify-center bg-[#F8F5EC] p-5 sm:p-10 lg:p-12">
          <div className="w-full max-w-[480px] rounded-[30px] border border-white/10 bg-[#211B47] px-6 py-10 text-[#F5F0E8] shadow-2xl sm:px-10 sm:py-12">

            {/* MASCOT */}
            <div className="flex justify-center">
              <BookMascot
                passwordFocused={passwordFocused}
                showPassword={showPassword}
              />
            </div>

            {/* HEADING */}
            <div className="mt-7 text-center">
              <p className="text-xs font-bold tracking-widest text-[#F5B942]">
                WELCOME BACK
              </p>

              <h1 className="mt-2 font-[var(--font-playfair)] text-4xl font-bold">
                Masuk.
              </h1>

              {/* ROLE CHIPS */}
              <div className="mt-5 flex justify-center gap-2">
                <span className="rounded-full bg-[#713A63] px-3 py-1 text-[10px] font-bold text-[#F5D9EF]">
                  Admin
                </span>

                <span className="rounded-full bg-[#9C6D30] px-3 py-1 text-[10px] font-bold text-[#FFE5AE]">
                  Pegawai
                </span>

                <span className="rounded-full bg-[#31558B] px-3 py-1 text-[10px] font-bold text-[#D1E6FF]">
                  Mahasiswa
                </span>
              </div>
            </div>

            {/* FORM */}
            <form action={handleLogin} className="mt-8 space-y-5">

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold text-[#C9C1E2]"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-[#514775] bg-[#302858] px-4 py-3.5 text-sm text-white placeholder:text-[#9991B6] outline-none transition focus:border-[#F5B942] focus:ring-2 focus:ring-[#F5B942]/20"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold text-[#C9C1E2]"
                >
                  Kata sandi
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi"
                    autoComplete="current-password"
                    required
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="w-full rounded-xl border border-[#514775] bg-[#302858] px-4 py-3.5 pr-12 text-sm text-white placeholder:text-[#9991B6] outline-none transition focus:border-[#F5B942] focus:ring-2 focus:ring-[#F5B942]/20"
                  />

                  {/* PASSWORD TOGGLE */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAA3C5] transition hover:text-[#F5B942]"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 002.83 2.83" />
                        <path d="M9.88 5.09A10.7 10.7 0 0112 5c5 0 9 7 9 7a16.4 16.4 0 01-4.17 4.5" />
                        <path d="M6.61 6.61A16.4 16.4 0 003 12s4 7 9 7a10.7 10.7 0 002.12-.21" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* LOGIN */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#F5B942] py-3.5 text-sm font-bold text-[#17132E] transition hover:bg-[#FFD166] hover:shadow-lg hover:shadow-[#F5B942]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>

            </form>

            {/* DIVIDER */}
            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#494164]" />

              <span className="text-xs text-[#A59DBD]">
                atau
              </span>

              <div className="h-px flex-1 bg-[#494164]" />
            </div>

            {/* GUEST */}
            <Link
              href="/"
              className="block w-full rounded-full border border-[#6B628C] py-3 text-center text-sm font-semibold text-[#E5DFF3] transition hover:bg-[#302858]"
            >
              Continue as Guest
            </Link>

            {/* REGISTER */}
            <p className="mt-7 text-center text-xs text-[#A59DBD]">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-bold text-[#F5B942] transition hover:text-[#FFD166]"
              >
                Daftar sebagai Mahasiswa
              </Link>
            </p>

          </div>
        </section>

      </div>
    </main>
  );
}