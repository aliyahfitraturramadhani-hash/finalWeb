"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  formatTanggalID,
  getAnnouncementCategoryLabel,
} from "@/lib/announcement-format";

export default function HomeExperience({
  categories,
  books,
  popularBooks = [],
  announcements = [],
}) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  const collectionRef = useRef(null);
  const isInteracting = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const resumeTimer = useRef(null);

  // =========================================
  // NAVIGATION
  // =========================================

  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function handleHomeClick(event) {
    event.preventDefault();
    setMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

function handleCategoriesClick(event) {
  event.preventDefault();
  setMenuOpen(false);

  if (window.location.pathname === "/") {
    document.getElementById("categories")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    window.location.assign("/#categories");
  }
}

  function handleAboutClick(event) {
    event.preventDefault();
    setMenuOpen(false);

    if (window.location.pathname === "/") {
      scrollToSection("about");
    } else {
      window.location.href = "/#about";
    }
  }

  function handleCollectionClick() {
    setMenuOpen(false);
  }

  // Scroll to anchor when arriving from another page
  useEffect(() => {
    if (window.location.hash) {
      const sectionId = window.location.hash.replace("#", "");

      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
    }
  }, []);

  // =========================================
  // MOUSE PARALLAX
  // =========================================

  useEffect(() => {
    let animationFrame;

    function handleMouseMove(event) {
      cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        setMouse({
          x: (event.clientX / window.innerWidth - 0.5) * 2,
          y: (event.clientY / window.innerHeight - 0.5) * 2,
        });
      });
    }

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // =========================================
  // AUTOMATIC COLLECTION MOVEMENT
  // =========================================

  useEffect(() => {
    const container = collectionRef.current;

    if (!container || books.length === 0) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) return;

    let animationFrame;

    function animate() {
      if (!isInteracting.current) {
        container.scrollLeft += 0.5;

        const halfWidth = container.scrollWidth / 2;

        if (halfWidth > 0 && container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        }
      }

      animationFrame = requestAnimationFrame(animate);
    }

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(resumeTimer.current);
    };
  }, [books.length]);

  // =========================================
  // PAUSE AND RESUME BELT
  // =========================================

  function pauseBelt() {
    isInteracting.current = true;
    clearTimeout(resumeTimer.current);
  }

  function resumeBelt() {
    clearTimeout(resumeTimer.current);

    resumeTimer.current = setTimeout(() => {
      isInteracting.current = false;
    }, 1500);
  }

  // =========================================
  // MOUSE DRAG
  // =========================================

  function handleMouseDown(event) {
    if (event.button !== 0) return;

    const container = collectionRef.current;
    if (!container) return;

    event.preventDefault();

    pauseBelt();

    isDragging.current = true;
    startX.current = event.clientX;
    startScrollLeft.current = container.scrollLeft;

    container.classList.add("is-dragging");
  }

  useEffect(() => {
    function handleMouseMove(event) {
      if (!isDragging.current) return;

      const container = collectionRef.current;
      if (!container) return;

      const distance = event.clientX - startX.current;

      container.scrollLeft =
        startScrollLeft.current - distance;
    }

    function handleMouseUp() {
      if (!isDragging.current) return;

      isDragging.current = false;

      collectionRef.current?.classList.remove("is-dragging");

      resumeBelt();
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // =========================================
  // TOUCHPAD AND MOUSE WHEEL
  // =========================================

  function handleCollectionWheel(event) {
    const container = collectionRef.current;
    if (!container) return;

    const movement =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (movement === 0) return;

    event.preventDefault();

    pauseBelt();

    container.scrollLeft += movement;

    resumeBelt();
  }

  // =========================================
  // BOOK DATA
  // =========================================

  const featuredBooks = books.slice(0, 12);
  const collectionBooks = [...books, ...books];

  const floatingPositions = [
    { top: "8%", left: "5%", rotate: "-13deg", size: "large" },
    { top: "3%", left: "59%", rotate: "12deg", size: "large" },
    { top: "42%", left: "23%", rotate: "7deg", size: "medium" },
    { top: "49%", left: "76%", rotate: "-10deg", size: "medium" },
    { top: "72%", left: "43%", rotate: "-7deg", size: "large" },
    { top: "24%", left: "83%", rotate: "8deg", size: "small" },
    { top: "65%", left: "3%", rotate: "11deg", size: "small" },
    { top: "78%", left: "75%", rotate: "13deg", size: "small" },
    { top: "17%", left: "37%", rotate: "-5deg", size: "small" },
    { top: "58%", left: "53%", rotate: "9deg", size: "small" },
    { top: "36%", left: "1%", rotate: "-9deg", size: "tiny" },
    { top: "88%", left: "24%", rotate: "6deg", size: "tiny" },
  ];

  return (
  <main className="landing-page min-h-screen overflow-hidden bg-[#351923] text-[#F5F0E8]">

      {/* NAVBAR */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/15 bg-[#351923]/40 px-6 py-5 shadow-lg shadow-black/5 backdrop-blur-2xl backdrop-saturate-150 md:px-16">

        <div className="flex items-center justify-between">

          {/* LOGO */}
          <Link
            href="/"
            onClick={handleHomeClick}
            className="font-serif text-2xl tracking-widest"
          >
            BOOKLYN<span className="text-[#D6AA65]">.</span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden items-center gap-10 text-sm text-white/70 md:flex">

            <a
              href="/"
              onClick={handleHomeClick}
              className="transition hover:text-[#D6AA65]"
            >
              Home
            </a>

            <Link
              href="/katalog"
              onClick={handleCollectionClick}
              className="transition hover:text-[#D6AA65]"
            >
              Collection
            </Link>

            <a
              href="/#categories"
              onClick={handleCategoriesClick}
              className="transition hover:text-[#D6AA65]"
            >
              Categories
            </a>

            <a
              href="/#about"
              onClick={handleAboutClick}
              className="transition hover:text-[#D6AA65]"
            >
              About
            </a>

            <Link
              href="/pengumuman"
              className="transition hover:text-[#D6AA65]"
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

          {/* MOBILE HAMBURGER */}
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

            <a
              href="/"
              onClick={handleHomeClick}
              className="rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65]"
            >
              Home
            </a>

            <Link
              href="/katalog"
              onClick={handleCollectionClick}
              className="rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65]"
            >
              Collection
            </Link>

            <a
              href="/#categories"
              onClick={handleCategoriesClick}
              className="rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65]"
            >
              Categories
            </a>

            <a
              href="/#about"
              onClick={handleAboutClick}
              className="rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65]"
            >
              About
            </a>

            <Link
              href="/pengumuman"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 transition hover:bg-white/5 hover:text-[#D6AA65]"
            >
              Announcements
            </Link>

            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-lg border border-[#D6AA65]/50 px-4 py-3 text-center text-[#D6AA65] transition hover:bg-[#D6AA65] hover:text-[#351923]"
            >
              Sign In
            </Link>

          </div>

        </div>

      </nav>

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-28 md:flex-row md:px-16">

        <div className="pointer-events-none absolute left-[-150px] top-40 h-96 w-96 rounded-full bg-[#8E4859]/20 blur-[120px]" />

        <div className="pointer-events-none absolute bottom-10 right-[-100px] h-96 w-96 rounded-full bg-[#D6AA65]/10 blur-[120px]" />

        {/* HERO TEXT */}
        <div className="relative z-20 w-full md:w-1/2">

          <p className="mb-6 text-xs uppercase tracking-[0.4em] text-[#D6AA65]">
            A little corner for every story
          </p>

          <h1 className="max-w-2xl font-serif text-6xl leading-[1.05] md:text-8xl">
            Find your
            <br />
            next <span className="italic text-[#D6AA65]">chapter.</span>
          </h1>

          <p className="mt-8 max-w-md text-sm leading-7 text-white/60 md:text-base">
            Every book holds a different universe.
            Find the stories that speak to you and let
            yourself get lost between the pages.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">

            <a
              href="#koleksi"
              className="rounded-full bg-[#D6AA65] px-8 py-4 text-sm font-semibold text-[#351923] transition duration-300 hover:-translate-y-1 hover:bg-[#F0C98B]"
            >
              Explore Collection ↗
            </a>

            <Link
              href="/register"
              className="rounded-full border border-white/30 px-8 py-4 text-sm transition hover:border-[#D6AA65] hover:text-[#D6AA65]"
            >
              Join BOOKLYN
            </Link>

          </div>

          {/* QUICK SEARCH */}
          <form
            action="/katalog"
            method="get"
            role="search"
            className="mt-8 flex max-w-md items-center gap-3 rounded-full border border-white/20 bg-white/5 py-2 pl-5 pr-2 backdrop-blur transition focus-within:border-[#D6AA65]"
          >
            <input
              type="search"
              name="q"
              placeholder="Search by book title or author..."
              aria-label="Search books by title or author"
              className="w-full bg-transparent text-sm text-[#F5F0E8] outline-none placeholder:text-white/40"
            />

            <button
              type="submit"
              className="rounded-full bg-[#D6AA65] px-5 py-2 text-xs font-semibold text-[#351923] transition hover:bg-[#F0C98B]"
            >
              Search
            </button>
          </form>

          {/* STATISTICS */}
          <div className="mt-16 flex gap-12 border-t border-white/10 pt-7">

            <div>
              <p className="font-serif text-3xl text-[#D6AA65]">
                {books.length.toString().padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs text-white/50">
                Book Titles
              </p>
            </div>

            <div>
              <p className="font-serif text-3xl text-[#D6AA65]">
                {categories.length.toString().padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs text-white/50">
                Categories
              </p>
            </div>

            <div>
              <p className="font-serif text-3xl text-[#D6AA65]">
                ∞
              </p>
              <p className="mt-1 text-xs text-white/50">
                Stories
              </p>
            </div>

          </div>
        </div>

        {/* FLOATING BOOKS */}
        <div className="floating-books relative mt-16 h-[540px] w-full md:mt-0 md:h-[680px] md:w-1/2 md:-translate-y-16">

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D6AA65]/20 md:h-[470px] md:w-[470px]"
            style={{
              transform: `translate(calc(-50% + ${mouse.x * 8}px), calc(-50% + ${mouse.y * 8}px))`,
            }}
          />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 md:h-[350px] md:w-[350px]" />

          {featuredBooks.map((book, index) => {
            const position = floatingPositions[index];

            if (!position) return null;

            return (
              <div
                key={book.id}
                className={`floating-book floating-book-${position.size} absolute overflow-hidden rounded-sm border border-[#D6AA65]/30 bg-[#512633] shadow-2xl transition duration-500 hover:z-40 hover:scale-110`}
                style={{
                  top: position.top,
                  left: position.left,
                  "--book-rotation": position.rotate,
                  "--parallax-x": `${mouse.x * (index % 3 + 2)}px`,
                  "--parallax-y": `${mouse.y * (index % 3 + 2)}px`,
                  animationDelay: `${index * -0.65}s`,
                  zIndex: index + 1,
                }}
              >
                {book.sampul ? (
                  <img
                    src={book.sampul}
                    alt={`Cover ${book.judul}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col justify-between p-3">
                    <span className="text-[8px] tracking-widest text-[#D6AA65]">
                      BOOKLYN
                    </span>

                    <div>
                      <h3 className="font-serif text-sm">
                        {book.judul}
                      </h3>
                      <p className="mt-2 text-[9px] text-white/60">
                        {book.penulis}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-white/10 py-5">

        <div className="marquee-track flex w-max gap-12 whitespace-nowrap text-sm uppercase tracking-[0.3em] text-[#D6AA65]">

          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex gap-12">
              {[
                "Discover Stories",
                "Find Your Escape",
                "Read Something New",
                "A World Between Pages",
              ].map((text) => (
                <span key={text}>✳ {text}</span>
              ))}
            </div>
          ))}

        </div>
      </div>

      {/* COLLECTION */}
      <section id="koleksi" className="overflow-hidden py-28">

        <div className="mb-16 flex flex-wrap items-end justify-between gap-6 px-6 md:px-16">

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#D6AA65]">
              The collection
            </p>

            <h2 className="font-serif text-5xl md:text-6xl">
              Stories worth
              <br />
              <span className="italic text-[#D6AA65]">
                discovering.
              </span>
            </h2>
          </div>

          <p className="max-w-xs text-sm leading-6 text-white/50">
            A curated collection of stories waiting to become part of yours.
          </p>

        </div>

        {/* INTERACTIVE COLLECTION */}
        {books.length > 0 ? (

          <div
            ref={collectionRef}
            className="collection-window"
            onMouseDown={handleMouseDown}
            onWheel={handleCollectionWheel}
            onMouseEnter={pauseBelt}
            onMouseLeave={() => {
              if (!isDragging.current) {
                resumeBelt();
              }
            }}
          >

            <div className="collection-track">

              {collectionBooks.map((book, index) => (
                <article
                  key={`${book.id}-${index}`}
                  className="collection-card group"
                  aria-hidden={index >= books.length}
                >

                  <div className="collection-cover">

                    {book.sampul ? (
                      <img
                        src={book.sampul}
                        alt={`Cover ${book.judul}`}
                        draggable="false"
                      />
                    ) : (
                      <div className="flex h-full flex-col justify-between p-5">
                        <span className="text-[9px] tracking-widest text-[#D6AA65]">
                          BOOKLYN
                        </span>

                        <div>
                          <h3 className="font-serif text-xl">
                            {book.judul}
                          </h3>

                          <p className="mt-2 text-xs text-white/50">
                            {book.penulis}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="collection-overlay">
                      Explore book ↗
                    </div>

                  </div>

                  <div className="mt-4">
                    <h3 className="font-serif text-lg text-[#F5F0E8]">
                      {book.judul}
                    </h3>

                    <p className="mt-1 text-xs text-white/50">
                      {book.penulis}
                    </p>
                  </div>

                </article>
              ))}

            </div>

          </div>

        ) : (

          <div className="px-6 py-20 text-center">
            <p className="font-serif text-3xl italic">
              Something beautiful is coming.
            </p>

            <p className="mt-4 text-sm text-white/50">
              Our collection will appear here soon.
            </p>
          </div>

        )}

        <p className="mt-5 text-center text-xs tracking-wider text-white/35">
          SWIPE, SCROLL OR DRAG TO EXPLORE THE COLLECTION
        </p>

      </section>

      {/* POPULAR BOOKS */}
      {popularBooks.length > 0 && (
        <section
          id="popular"
          className="border-t border-white/10 px-6 py-28 md:px-16"
        >

          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#D6AA65]">
                Most borrowed
              </p>

              <h2 className="font-serif text-5xl md:text-6xl">
                The books everyone
                <br />
                <span className="italic text-[#D6AA65]">
                  keeps borrowing.
                </span>
              </h2>
            </div>

            <p className="max-w-xs text-sm leading-6 text-white/50">
              The five most popular titles, ranked by how often our members borrow them.
            </p>

          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">

            {popularBooks.map((book, index) => (
              <Link
                key={book.id}
                href={`/katalog/${book.id}`}
                className="group block"
              >

                <div className="relative aspect-[2/3] overflow-hidden rounded-[5px] bg-[#512633] shadow-[0_15px_35px_rgba(0,0,0,0.25)] transition duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)]">

                  {book.sampul ? (
                    <img
                      src={book.sampul}
                      alt={`Cover ${book.judul}`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="flex h-full flex-col justify-between p-5">
                      <span className="text-[9px] tracking-widest text-[#D6AA65]">
                        BOOKLYN
                      </span>

                      <h3 className="font-serif text-xl">
                        {book.judul}
                      </h3>
                    </div>
                  )}

                  <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#D6AA65] font-serif text-sm font-bold text-[#351923] shadow-lg">
                    {index + 1}
                  </span>

                </div>

                <h3 className="mt-4 font-serif text-lg leading-snug text-[#F5F0E8] transition group-hover:text-[#D6AA65]">
                  {book.judul}
                </h3>

                <p className="mt-1 text-xs text-white/50">
                  {book.penulis}
                </p>

                <p className="mt-2 text-xs text-[#D6AA65]">
                  {book.jumlah_pinjam} loans
                </p>

              </Link>
            ))}

          </div>

        </section>
      )}

      {/* CATEGORIES */}
      <section
        id="categories"
        className="bg-[#F5F0E8] px-6 py-28 text-[#351923] md:px-16"
      >

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#98734B]">
          Explore by category
        </p>

        <h2 className="mb-12 font-serif text-5xl">
          Find your kind of story.
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/katalog?category=${encodeURIComponent(category.nama_kategori)}`}
              className="group block rounded-xl border border-[#351923]/10 p-7 transition duration-300 hover:-translate-y-2 hover:bg-[#351923] hover:text-[#F5F0E8]"
            >
              <span className="text-xs text-[#98734B]">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3 className="mt-8 font-serif text-3xl">
                {category.nama_kategori}
              </h3>

              <p className="mt-3 text-sm opacity-60">
                {category.deskripsi}
              </p>

              <div className="mt-8 text-right transition group-hover:translate-x-2">
                ↗
              </div>
            </Link>
          ))}

        </div>

      </section>

      {/* ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <section
          id="announcements"
          className="border-t border-white/10 bg-[#2A1119] px-6 py-28 md:px-16"
        >

          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#D6AA65]">
                Library notice board
              </p>

              <h2 className="font-serif text-5xl md:text-6xl">
                Latest{" "}
                <span className="italic text-[#D6AA65]">
                  announcements.
                </span>
              </h2>
            </div>

            <Link
              href="/pengumuman"
              className="text-sm text-[#D6AA65] transition hover:text-[#F0C98B]"
            >
              View all announcements ↗
            </Link>

          </div>

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

                <h3 className="mt-8 font-serif text-2xl leading-snug">
                  {item.judul}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  {item.ringkasan}
                </p>

                <div className="mt-8 text-right text-[#D6AA65] transition group-hover:translate-x-2">
                  ↗
                </div>

              </Link>
            ))}

          </div>

        </section>
      )}

      {/* ABOUT */}
      <section id="about" className="px-6 py-28 text-center md:px-16">

        <p className="mb-5 text-xs uppercase tracking-[0.35em] text-[#D6AA65]">
          More than just a library
        </p>

        <h2 className="mx-auto max-w-3xl font-serif text-5xl leading-tight md:text-7xl">
          Every reader belongs to a story.
        </h2>

        <p className="mx-auto mt-8 max-w-lg text-sm leading-7 text-white/50">
          BOOKLYN is a little corner for every story.
          A place to discover books, explore new worlds,
          and find the next chapter of your journey.
        </p>

        <Link
          href="/register"
          className="mt-10 inline-block rounded-full bg-[#D6AA65] px-9 py-4 text-sm font-semibold text-[#351923] transition hover:-translate-y-1 hover:bg-[#F0C98B]"
        >
          Become a Member ↗
        </Link>

{/* CONTACT ADMIN */}
<div className="mx-auto mt-16 max-w-xl rounded-2xl border border-[#D6AA65]/20 bg-[#D6AA65]/5 px-6 py-5 text-left transition hover:border-[#D6AA65]/40 hover:bg-[#D6AA65]/10">

  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

    {/* TEXT */}
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[#D6AA65]">
        Interested in joining our team?
      </p>

      <h3 className="mt-2 font-serif text-xl text-[#F5F0E8]">
        Become a BOOKLYN Staff
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
        Interested in becoming part of our library team?
        Contact our administrator for further information.
      </p>
    </div>

    {/* CONTACT */}
    <div className="flex shrink-0 flex-col gap-3 text-sm">

      <a
        href="mailto:admin@booklyn-library.com"
        className="flex items-center gap-3 text-[#F5F0E8]/80 transition hover:text-[#D6AA65]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D6AA65]/10 text-[#D6AA65]">
          ✉
        </span>

        admin@booklyn-library.com
      </a>

      <a
        href="tel:+6281234567890"
        className="flex items-center gap-3 text-[#F5F0E8]/80 transition hover:text-[#D6AA65]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D6AA65]/10 text-[#D6AA65]">
          ☎
        </span>

        +62 812-3456-7890
      </a>

    </div>

  </div>

</div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8 md:px-16">

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/40 md:flex-row">

          <p className="font-serif text-xl tracking-widest text-[#F5F0E8]">
            BOOKLYN.
          </p>

          <p>A little corner for every story.</p>

          <p>© 2026 BOOKLYN. All rights reserved.</p>

        </div>

      </footer>

    </main>
  );
}