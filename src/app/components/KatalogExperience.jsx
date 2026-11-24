"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PublicNavbar from "./PublicNavbar";

const MODES = [
  { id: "rak", label: "Rack", icon: "▤" },
  { id: "flow", label: "Flow", icon: "◫" },
  { id: "orbit", label: "Orbit", icon: "◎" },
  { id: "mosaik", label: "Mosaic", icon: "▦" },
];

const SHELF_NAMES = [
  "FANTASY & ADVENTURE",
  "CONTEMPORARY STORIES",
  "OTHER WORLDS & PERSPECTIVES",
];

function getCover(book) {
  if (!book?.sampul) return null;

  if (
    book.sampul.startsWith("/") ||
    book.sampul.startsWith("http")
  ) {
    return book.sampul;
  }

  return `/images/books/${book.sampul}`;
}

function getBookCategories(book) {
  return Array.isArray(book?.categories) ? book.categories : [];
}

function getBookPages(book) {
  return (
    book?.jumlah_halaman ??
    book?.halaman ??
    book?.page_count ??
    null
  );
}

export default function KatalogExperience({
  books = [],
  categories = [],
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [mode, setMode] = useState("rak");

  const [selectedBook, setSelectedBook] = useState(
    () =>
      books.find((book) => book.judul === "True Colors") ||
      books[0] ||
      null
  );

  const [detailOpen, setDetailOpen] = useState(true);

  // ORBIT
  const [orbitAngle, setOrbitAngle] = useState(0);
  const [orbitPaused, setOrbitPaused] = useState(false);

  const orbitDrag = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    velocity: 0,
  });

  const orbitStageRef = useRef(null);
  const orbitFrameRef = useRef(null);

  // MOSAIC
  const mosaicRef = useRef(null);
  const previousRects = useRef(new Map());

  // READ CATEGORY FROM URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("category");
    const requestedSearch = params.get("q");

    if (requestedSearch) {
      setSearch(requestedSearch);
    }

    if (
      requestedCategory &&
      categories.some(
        (category) => category.nama_kategori === requestedCategory
      )
    ) {
      setActiveCategory(requestedCategory);
    }
  }, [categories]);

  // FILTER BOOKS
  const filteredBooks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !keyword ||
        book.judul?.toLowerCase().includes(keyword) ||
        book.penulis?.toLowerCase().includes(keyword);

      const matchesCategory =
        activeCategory === "Semua" ||
        getBookCategories(book).includes(activeCategory);

      return matchesSearch && matchesCategory;
    });
  }, [books, search, activeCategory]);

  // UPDATE SELECTED BOOK
  useEffect(() => {
    if (
      !selectedBook ||
      !filteredBooks.some(
        (book) => book.id === selectedBook.id
      )
    ) {
      setSelectedBook(filteredBooks[0] || null);
    }
  }, [filteredBooks, selectedBook]);

  // DIVIDE BOOKS INTO THREE SHELVES
  const shelfBooks = useMemo(() => {
    const result = [[], [], []];

    if (!filteredBooks.length) return result;

    const perShelf = Math.ceil(filteredBooks.length / 3);

    filteredBooks.forEach((book, index) => {
      const shelfIndex = Math.min(
        Math.floor(index / perShelf),
        2
      );

      result[shelfIndex].push(book);
    });

    return result;
  }, [filteredBooks]);

  function selectBook(book) {
    setSelectedBook(book);
    setDetailOpen(true);
  }

  // ORBIT AUTOMATIC ROTATION
  useEffect(() => {
    if (
      mode !== "orbit" ||
      filteredBooks.length < 2 ||
      orbitPaused
    ) {
      return;
    }

    let frame;
    let previous = 0;

    const animate = (time) => {
      if (!previous) previous = time;

      const delta = Math.min(time - previous, 40);
      previous = time;

      if (!orbitDrag.current.active) {
        setOrbitAngle((angle) => angle + delta * 0.0015);
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [mode, filteredBooks.length, orbitPaused]);

  // ORBIT DRAG
  function handleOrbitPointerDown(event) {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );

    orbitDrag.current = {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
      velocity: 0,
    };

    setOrbitPaused(true);
  }

  function handleOrbitPointerMove(event) {
    if (!orbitDrag.current.active) return;

    const dx =
      event.clientX - orbitDrag.current.lastX;

    orbitDrag.current.lastX = event.clientX;
    orbitDrag.current.lastY = event.clientY;

    orbitDrag.current.velocity = dx * 0.012;

    setOrbitAngle((angle) => angle + dx * 0.012);
  }

  function handleOrbitPointerUp() {
    if (!orbitDrag.current.active) return;

    orbitDrag.current.active = false;

    const velocity = orbitDrag.current.velocity;
    let remaining = velocity;

    const coast = () => {
      if (Math.abs(remaining) < 0.0008) {
        setOrbitPaused(false);
        return;
      }

      setOrbitAngle((angle) => angle + remaining);

      remaining *= 0.94;

      orbitFrameRef.current =
        requestAnimationFrame(coast);
    };

    cancelAnimationFrame(orbitFrameRef.current);

    orbitFrameRef.current =
      requestAnimationFrame(coast);
  }

  // MOSAIC FLIP ANIMATION
  useEffect(() => {
    if (
      mode !== "mosaik" ||
      !mosaicRef.current
    ) {
      return;
    }

    const nodes = [
      ...mosaicRef.current.querySelectorAll(
        "[data-mosaic-id]"
      ),
    ];

    const nextRects = new Map();

    nodes.forEach((node) => {
      const id = node.dataset.mosaicId;
      const next = node.getBoundingClientRect();

      const previous = previousRects.current.get(id);

      if (previous) {
        const dx = previous.left - next.left;
        const dy = previous.top - next.top;

        if (dx || dy) {
          node.animate(
            [
              {
                transform:
                  `translate(${dx}px, ${dy}px) scale(.96)`,
              },
              {
                transform:
                  "translate(0, 0) scale(1)",
              },
            ],
            {
              duration: 560,
              easing: "cubic-bezier(.2,.75,.25,1)",
            }
          );
        }
      } else {
        node.animate(
          [
            {
              opacity: 0,
              transform:
                "translateY(18px) scale(.96)",
            },
            {
              opacity: 1,
              transform:
                "translateY(0) scale(1)",
            },
          ],
          {
            duration: 480,
            easing: "cubic-bezier(.2,.75,.25,1)",
          }
        );
      }

      nextRects.set(id, next);
    });

    previousRects.current = nextRects;
  }, [mode, filteredBooks, activeCategory, search]);

  // RENDER ORBIT BOOKS
  function renderOrbitBooks() {
    const total = filteredBooks.length;

    return filteredBooks.map((book, index) => {
      const ring = index % 2;
      const ringIndex = Math.floor(index / 2);

      const ringCount = Math.ceil(
        (total - ring) / 2
      );

      const angle =
        orbitAngle +
        (ringIndex / Math.max(ringCount, 1)) *
          Math.PI *
          2 +
        ring * 0.45;

      const xRadius = ring === 0 ? 35 : 23;
      const yRadius = ring === 0 ? 31 : 20;

      const x = 50 + Math.cos(angle) * xRadius;
      const y = 50 + Math.sin(angle) * yRadius;

      const depth = (Math.sin(angle) + 1) / 2;

      const scale =
        0.58 +
        depth * 0.42 +
        (ring === 1 ? -0.05 : 0);

      const opacity = 0.58 + depth * 0.42;

      return (
        <button
          key={book.id}
          className={`orbit-book ${
            selectedBook?.id === book.id
              ? "book-selected"
              : ""
          }`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            zIndex: Math.round(
              10 +
                depth * 30 +
                (ring === 1 ? -2 : 0)
            ),
            "--orbit-scale": scale,
            "--orbit-opacity": opacity,
          }}
          onClick={() => selectBook(book)}
          title={`${book.judul} — ${book.penulis}`}
        >
          {getCover(book) ? (
            <img
              src={getCover(book)}
              alt={book.judul}
              draggable="false"
            />
          ) : (
            <span className="orbit-fallback">
              {book.judul}
            </span>
          )}
        </button>
      );
    });
  }

  return (
    <main className="catalog-page min-h-screen bg-[#17132E] text-[#F5F0E8]">


      {/* NAVBAR */}
 {/* NAVBAR */}

<header className="catalog-navbar">
  <Link href="/" className="catalog-logo">
    BOOKLYN<span>.</span>
  </Link>

  <nav>
    <Link href="/">Home</Link>

    <Link href="/katalog" className="active">
      Collection
    </Link>

    <Link href="/#categories">
      Categories
    </Link>

    <Link href="/#about">
      About
    </Link>

    <Link href="/pengumuman">
      Announcements
    </Link>
  </nav>

  <Link href="/login" className="catalog-signin">
    Sign In
  </Link>
</header>

      <div className="catalog-main">

        {/* INTRO */}

        <section className="catalog-intro">
          <div>
            <p className="catalog-eyebrow">
              THE BOOKLYN COLLECTION
            </p>

            <h1>
              A world between{" "}
              <em>the shelves.</em>
            </h1>

            <p className="catalog-description">
              Explore our collection, discover unexpected
              stories, and find the next book waiting to
              become yours.
            </p>
          </div>

          <div className="catalog-counter">
            <strong>{filteredBooks.length}</strong>
            <span>Books found</span>
          </div>
        </section>

        {/* SEARCH AND MODES */}

        <section className="catalog-toolbar">
          <div className="catalog-search">
            <span>⌕</span>

            <input
              type="search"
              placeholder="Search by book title or author..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button onClick={() => setSearch("")}>
                ×
              </button>
            )}
          </div>

          <div className="catalog-modes">
            {MODES.map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={
                  mode === item.id ? "selected" : ""
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* CATEGORY FILTER */}

        <section id="categories" className="catalog-genres">
          <button
            className={
              activeCategory === "Semua" ? "selected" : ""
            }
            onClick={() => setActiveCategory("Semua")}
          >
            Semua
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              className={
                activeCategory === category.nama_kategori
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setActiveCategory(category.nama_kategori)
              }
            >
              {category.nama_kategori}
            </button>
          ))}
        </section>

        {/* CATALOG BODY */}

        <section
          className={`catalog-body ${
            detailOpen ? "" : "detail-hidden"
          }`}
        >
          <div className="bookshelf-panel">

            {filteredBooks.length === 0 ? (
              <div className="catalog-empty">
                <span>⌕</span>

                <h2>No stories found.</h2>

                <p>
                  Try searching for another title or category.
                </p>

                <button
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("Semua");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : mode === "rak" ? (
              <div className="rack-layout">
                {shelfBooks.map((shelf, shelfIndex) => (
                  <div
                    className="rack-row"
                    key={shelfIndex}
                  >
                    <div className="rack-label">
                      <span>
                        {SHELF_NAMES[shelfIndex]}
                      </span>

                      <span>{shelf.length} books</span>
                    </div>

                    <div className="rack-books">
                      {shelf.map((book, index) => (
                        <BookSpine
                          key={book.id}
                          book={book}
                          index={index}
                          selected={
                            selectedBook?.id === book.id
                          }
                          onClick={() => selectBook(book)}
                        />
                      ))}
                    </div>

                    <div className="rack-wood" />
                  </div>
                ))}
              </div>
            ) : mode === "flow" ? (
              <div className="flow-layout">
                {filteredBooks.map((book, index) => (
                  <BookCover
                    key={book.id}
                    book={book}
                    selected={
                      selectedBook?.id === book.id
                    }
                    onClick={() => selectBook(book)}
                    index={index}
                  />
                ))}
              </div>
            ) : mode === "orbit" ? (
              <div
                ref={orbitStageRef}
                className="orbit-layout"
                onPointerDown={handleOrbitPointerDown}
                onPointerMove={handleOrbitPointerMove}
                onPointerUp={handleOrbitPointerUp}
                onPointerCancel={handleOrbitPointerUp}
                onPointerEnter={() =>
                  setOrbitPaused(true)
                }
                onPointerLeave={() => {
                  if (!orbitDrag.current.active) {
                    setOrbitPaused(false);
                  }
                }}
              >
                <div className="orbit-glow" />
                <div className="orbit-ring orbit-ring-outer" />
                <div className="orbit-ring orbit-ring-inner" />
                <div className="orbit-core">
                  <span />
                </div>

                {renderOrbitBooks()}

                <p className="orbit-instruction">
                  DRAG TO ROTATE THE ORBITS
                </p>
              </div>
            ) : (
              <div
                className="mosaic-layout"
                ref={mosaicRef}
              >
                {filteredBooks.map((book, index) => (
                  <MosaicBook
                    key={book.id}
                    book={book}
                    index={index}
                    selected={
                      selectedBook?.id === book.id
                    }
                    onClick={() => selectBook(book)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* DETAIL PANEL */}

          {detailOpen && selectedBook && (
            <aside className="book-detail-panel">
              <button
                className="detail-close"
                onClick={() => setDetailOpen(false)}
                aria-label="Close detail"
              >
                ×
              </button>

              <div className="detail-cover">
                {getCover(selectedBook) ? (
                  <img
                    src={getCover(selectedBook)}
                    alt={selectedBook.judul}
                  />
                ) : (
                  <div className="cover-placeholder">
                    {selectedBook.judul}
                  </div>
                )}
              </div>

              <div className="detail-heading">
                <h2>{selectedBook.judul}</h2>

                <p>{selectedBook.penulis}</p>

                <div className="detail-rating">
                  ★ ★ ★ ★ <span>★</span>
                </div>
              </div>

              <div className="detail-tags">
                {getBookCategories(selectedBook).map(
                  (category) => (
                    <span key={category}>{category}</span>
                  )
                )}
              </div>

              <p className="detail-description">
                {selectedBook.deskripsi ||
                  "Discover the story and explore this title in the BOOKLYN collection."}
              </p>

              <div className="detail-metadata">
                <div>
                  <span>Copies</span>
                  <strong>
                    {selectedBook.stok_tersedia ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Year</span>
                  <strong>
                    {selectedBook.tahun_terbit || "-"}
                  </strong>
                </div>

                <div>
                  <span>Publisher</span>
                  <strong>
                    {selectedBook.penerbit || "-"}
                  </strong>
                </div>
              </div>

              <div className="detail-actions">
                <Link
                  href="/login"
                  className="detail-primary"
                >
                  Beri ulasan
                </Link>

                <Link
                  href="/login"
                  className="detail-secondary"
                >
                  ♧ Simpan ke Rak
                </Link>

                <Link
                  href={`/katalog/${selectedBook.id}`}
                  className="detail-secondary"
                >
                  Lihat Detail Lengkap ↗
                </Link>
              </div>

              <p className="detail-hint">
                Select another book to explore.
              </p>
            </aside>
          )}
        </section>

        {!detailOpen && (
          <button
            className="show-detail-button"
            onClick={() => setDetailOpen(true)}
            disabled={!selectedBook}
          >
            Show book details
          </button>
        )}
      </div>
    </main>
  );
}

function BookSpine({
  book,
  index,
  selected,
  onClick,
}) {
  const cover = getCover(book);

  return (
    <button
      className={`rack-book ${
        selected ? "book-selected" : ""
      }`}
      onClick={onClick}
      title={`${book.judul} — ${book.penulis}`}
      style={{
        "--book-delay": `${index * 35}ms`,
      }}
    >
      {cover ? (
        <img src={cover} alt={book.judul} />
      ) : (
        <div className="spine-fallback">
          <span>{book.judul}</span>
        </div>
      )}
    </button>
  );
}

function BookCover({
  book,
  selected,
  onClick,
  index,
}) {
  const cover = getCover(book);

  return (
    <button
      className={`mode-book ${
        selected ? "book-selected" : ""
      }`}
      onClick={onClick}
      style={{
        "--book-delay": `${index * 30}ms`,
      }}
    >
      {cover ? (
        <img src={cover} alt={book.judul} />
      ) : (
        <div className="spine-fallback">
          {book.judul}
        </div>
      )}

      <span>{book.judul}</span>
    </button>
  );
}

function MosaicBook({
  book,
  index,
  selected,
  onClick,
}) {
  const cover = getCover(book);
  const pages = getBookPages(book);

  const age =
    book?.batas_usia ??
    book?.usia_minimum ??
    null;

  return (
    <button
      data-mosaic-id={book.id}
      className={`mosaic-card mosaic-size-${index % 7} ${
        selected ? "book-selected" : ""
      }`}
      onClick={onClick}
      aria-label={`Lihat detail ${book.judul}`}
    >
      <span className="mosaic-card-inner">

        <span className="mosaic-face mosaic-front">
          {cover ? (
            <img
              src={cover}
              alt=""
              draggable="false"
            />
          ) : (
            <span className="mosaic-cover-fallback">
              {book.judul}
            </span>
          )}

          <span className="mosaic-front-title">
            {book.judul}
          </span>
        </span>

        <span className="mosaic-face mosaic-back">
          <span className="mosaic-back-kicker">
            BOOKLYN COLLECTION
          </span>

          <strong>{book.judul}</strong>

          <span className="mosaic-author">
            {book.penulis || "Unknown author"}
          </span>

          <span
            className="mosaic-stars"
            aria-label="Rating belum tersedia"
          >
            ✦ ✦ ✦ ✦ ✦
          </span>

          <span className="mosaic-meta">
            {pages
              ? `${pages} halaman`
              : "Detail buku"}
          </span>

          {age ? (
            <span className="mosaic-age">
              {age}+
            </span>
          ) : null}

          <span className="mosaic-open">
            KLIK UNTUK DETAIL ↗
          </span>
        </span>

      </span>
    </button>
  );
}