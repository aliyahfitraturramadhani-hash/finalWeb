"use client";

import Link from "next/link";

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

function formatDate(date) {
  if (!date) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default function BookDetailExperience({
  book,
  rating,
  reviews = [],
  relatedBooks = [],
}) {
  const totalReviews = Number(rating?.total_ulasan || 0);
  const averageRating = Number(rating?.rata_rating || 0);
  const cover = getCover(book);

  const categories = Array.isArray(book.categories)
    ? book.categories
    : [];

  const ratingBars = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: Number(rating?.[`bintang_${star}`] || 0),
  }));

  async function shareBook() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: book.judul,
          text: `Lihat buku ${book.judul} di BOOKLYN.`,
          url,
        });
      } catch {
        // Pengguna membatalkan share.
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("Link buku berhasil disalin!");
      } catch {
        alert("Link buku tidak dapat disalin dari browser ini.");
      }
    }
  }

  return (
    <main className="book-detail-page">

      {/* NAVBAR */}

      <header className="bd-header">
        <Link href="/" className="bd-logo">
          BOOKLYN<span>.</span>
        </Link>

        <nav aria-label="Navigasi utama">
          <Link href="/">Home</Link>

          <Link href="/katalog" className="bd-nav-active">
            Collection
          </Link>

          <Link href="/#about">About</Link>
        </nav>

        <Link href="/login" className="bd-login">
          Sign In
        </Link>
      </header>

      <div className="bd-container">

        {/* BREADCRUMB */}

        <div className="bd-breadcrumb">
          <Link href="/katalog">Catalog</Link>
          <span>›</span>
          <span className="bd-current">{book.judul}</span>
        </div>

        {/* MAIN BOOK CONTENT */}

        <section className="bd-main">

          {/* LEFT COLUMN */}

          <div className="bd-cover-column">

            {/* STATIC 3D BOOK COVER */}

            <div
              className="bd-book-scene"
              aria-label={`Cover buku ${book.judul}`}
            >
              <div className="bd-book-3d">

                <div className="bd-book-front">
                  {cover ? (
                    <img
                      src={cover}
                      alt={`Sampul ${book.judul}`}
                    />
                  ) : (
                    <div className="bd-cover-placeholder">
                      {book.judul}
                    </div>
                  )}
                </div>

                <div
                  className="bd-book-spine"
                  aria-hidden="true"
                />

                <div
                  className="bd-book-pages"
                  aria-hidden="true"
                />

              </div>
            </div>

            {/* BOOK INFORMATION */}

            <div className="bd-info-grid">

              <div className="bd-info-card">
                <strong>{book.stok_tersedia ?? 0}</strong>
                <span>Copies available</span>
              </div>

              <div className="bd-info-card">
                <strong>{book.tahun_terbit || "-"}</strong>
                <span>Publication year</span>
              </div>

              <div className="bd-info-card">
                <strong>
                  {categories.length > 0
                    ? categories.join(", ")
                    : "-"}
                </strong>
                <span>Categories</span>
              </div>

              <div className="bd-info-card">
                <strong>{book.lokasi_rak || "-"}</strong>
                <span>Shelf location</span>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN */}

          <div className="bd-content">

            <p className="bd-eyebrow">
              BOOK DETAILS
            </p>

            <h1>{book.judul}</h1>

            <p className="bd-author">
              {book.penulis || "Unknown author"}
            </p>

            {/* CATEGORIES */}

            <div className="bd-tags">

              {categories.length > 0 ? (
                categories.map((category) => (
                  <Link
                    key={category}
                    href={`/katalog?category=${encodeURIComponent(category)}`}
                  >
                    {category}
                  </Link>
                ))
              ) : (
                <span>
                  Kategori belum ditentukan
                </span>
              )}

            </div>

            {/* PUBLISHING INFORMATION */}

            <div className="bd-publishing">

              <div>
                <span>Publisher</span>
                <strong>{book.penerbit || "-"}</strong>
              </div>

              <div>
                <span>ISBN</span>
                <strong>{book.isbn || "-"}</strong>
              </div>

              <div>
                <span>Max loan period</span>
                <strong>
                  {book.durasi_maksimal_pinjam_hari
                    ? `${book.durasi_maksimal_pinjam_hari} days`
                    : "-"}
                </strong>
              </div>

              <div>
                <span>Late fine per day</span>
                <strong>
                  {book.tarif_denda_harian != null
                    ? `Rp ${Number(book.tarif_denda_harian).toLocaleString("id-ID")}`
                    : "-"}
                </strong>
              </div>

            </div>

            {/* SYNOPSIS */}

            <section className="bd-synopsis">

              <h2>Synopsis</h2>

              <p>
                {book.deskripsi ||
                  "Belum ada deskripsi untuk buku ini."}
              </p>

            </section>

            {/* RATING */}

            <section
              className="bd-rating-card"
              aria-label="Book rating summary"
            >

              <div className="bd-rating-score">

                <strong>
                  {totalReviews > 0
                    ? averageRating.toFixed(1).replace(".", ",")
                    : "-"}
                </strong>

                <div className="bd-rating-stars">

                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={index}
                      className={
                        index < Math.round(averageRating)
                          ? "filled"
                          : ""
                      }
                    >
                      ★
                    </span>
                  ))}

                </div>

                <small>{totalReviews} reviews</small>

              </div>

              <div className="bd-rating-bars">

                {ratingBars.map(({ star, count }) => {

                  const percentage =
                    totalReviews > 0
                      ? (count / totalReviews) * 100
                      : 0;

                  return (
                    <div
                      className="bd-rating-row"
                      key={star}
                    >

                      <span>{star} ★</span>

                      <div className="bd-bar-track">
                        <div
                          className="bd-bar-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <small>
                        {Math.round(percentage)}%
                      </small>

                    </div>
                  );
                })}

              </div>

            </section>

            {/* ACTION BUTTONS */}

            <div className="bd-actions">

              <Link
                href="/login"
                className="bd-primary-action"
              >
                Write a Review
              </Link>

              <Link
                href="/login"
                className="bd-secondary-action"
              >
                ♧ Save to Shelf
              </Link>

              <button
                type="button"
                className="bd-secondary-action"
                onClick={shareBook}
              >
                ↗ Share
              </button>

            </div>

          </div>

        </section>

        {/* READER REVIEWS */}

        <section className="bd-reviews-section">

          <div className="bd-section-heading">

            <div>
              <p className="bd-eyebrow">COMMUNITY</p>
              <h2>Reader Reviews</h2>
            </div>

            <span>{totalReviews} reviews</span>

          </div>

          {reviews.length > 0 ? (

            <div className="bd-reviews-grid">

              {reviews.map((review, index) => (

                <article
                  className="bd-review-card"
                  key={`${review.created_at}-${index}`}
                >

                  <div className="bd-review-top">

                    <strong>
                      {review.nama_pengguna || "BOOKLYN Member"}
                    </strong>

                    <span>
                      {"★".repeat(Number(review.rating))}
                    </span>

                  </div>

                  <p>
                    {review.komentar ||
                      "Member memberikan rating untuk buku ini."}
                  </p>

                  <small>
                    {formatDate(review.created_at)}
                  </small>

                </article>

              ))}

            </div>

          ) : (

            <div className="bd-no-reviews">
              <span>✧</span>

              <p>
                No reviews yet. Be the first to share your thoughts!
              </p>
            </div>

          )}

        </section>

        {/* RELATED BOOKS */}

        {relatedBooks.length > 0 && (

          <section className="bd-related-section">

            <div className="bd-section-heading">

              <div>
                <p className="bd-eyebrow">KEEP EXPLORING</p>
                <h2>You may also like</h2>
              </div>

              <Link href="/katalog">
                View Collection ↗
              </Link>

            </div>

            <div className="bd-related-list">

              {relatedBooks.map((related) => (

                <Link
                  href={`/katalog/${related.id}`}
                  className="bd-related-book"
                  key={related.id}
                >

                  <div className="bd-related-cover">

                    {getCover(related) ? (
                      <img
                        src={getCover(related)}
                        alt={related.judul}
                      />
                    ) : (
                      <span>{related.judul}</span>
                    )}

                  </div>

                  <strong>{related.judul}</strong>
                  <small>{related.penulis}</small>

                </Link>

              ))}

            </div>

          </section>

        )}

        {/* FOOTER */}

        <footer className="bd-footer">

          <Link href="/katalog">
            ← Back to Collection
          </Link>

          <span>
            BOOKLYN · A little corner for every story.
          </span>

        </footer>

      </div>

      {/* PAGE STYLES */}

      <style jsx global>{`

        .book-detail-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 18% 35%, rgba(104,40,89,.22), transparent 38%),
            radial-gradient(ellipse at 85% 70%, rgba(67,48,116,.22), transparent 38%),
            #17132e;
          color: #f5f0e8;
          font-family: Arial, sans-serif;
        }

        /* NAVBAR */

        .bd-header {
          height: 70px;
          padding: 0 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,.09);
          background: rgba(20,16,42,.85);
          backdrop-filter: blur(18px);
        }

        .bd-logo {
          color: #f5f0e8;
          font-family: Georgia, serif;
          font-size: 25px;
          letter-spacing: 3px;
          text-decoration: none;
        }

        .bd-logo span {
          color: #f5b942;
        }

        .bd-header nav {
          display: flex;
          gap: 35px;
        }

        .bd-header nav a,
        .bd-login {
          color: rgba(245,240,232,.65);
          text-decoration: none;
          font-size: 13px;
        }

        .bd-header nav a:hover,
        .bd-header nav .bd-nav-active {
          color: #f5b942;
        }

        .bd-login {
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 30px;
          padding: 10px 24px;
        }

        /* CONTAINER */

        .bd-container {
          width: min(1440px, 90%);
          margin: auto;
          padding: 28px 0 65px;
        }

        .bd-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          color: rgba(245,240,232,.48);
          font-size: 12px;
          margin-bottom: 34px;
        }

        .bd-breadcrumb a {
          color: #f5b942;
          text-decoration: none;
        }

        .bd-current {
          color: #f5f0e8;
        }

        /* MAIN LAYOUT */

        .bd-main {
          display: grid;
          grid-template-columns: minmax(300px,.78fr) minmax(0,1.55fr);
          gap: clamp(38px,6vw,90px);
          align-items: start;
        }

        .bd-cover-column {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* STATIC 3D BOOK */

        .bd-book-scene {
          width: min(340px,100%);
          height: 475px;
          display: flex;
          justify-content: center;
          align-items: center;
          perspective: 1200px;
        }

        .bd-book-3d {
          position: relative;
          width: 285px;
          height: 430px;
          transform: rotateY(-8deg) rotateX(1deg);
          transform-style: preserve-3d;
          filter: drop-shadow(22px 28px 22px rgba(0,0,0,.4));
        }

        .bd-book-front {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 4px 7px 7px 4px;
          background: #63214f;
          box-shadow:
            inset 8px 0 12px rgba(0,0,0,.22),
            3px 0 0 rgba(255,255,255,.08);
        }

        .bd-book-front img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bd-cover-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          padding: 25px;
          text-align: center;
          font-family: Georgia, serif;
          font-size: 27px;
          background: linear-gradient(145deg,#6e347d,#9c1d60);
        }

        .bd-book-spine {
          position: absolute;
          top: 0;
          left: -17px;
          width: 18px;
          height: 100%;
          transform: rotateY(-90deg);
          transform-origin: right;
          background: linear-gradient(90deg,#30112e,#8c376c);
        }

        .bd-book-pages {
          position: absolute;
          top: 4px;
          right: -13px;
          width: 13px;
          height: calc(100% - 8px);
          transform: rotateY(90deg);
          transform-origin: left;
          background: repeating-linear-gradient(
            90deg,
            #eee4ca 0,
            #eee4ca 2px,
            #d4c8ad 3px,
            #eee4ca 4px
          );
          box-shadow: 2px 0 4px rgba(0,0,0,.18);
        }

        /* INFORMATION CARDS */

        .bd-info-grid {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 10px;
        }

        .bd-info-card {
          min-height: 78px;
          padding: 15px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 13px;
          background: rgba(255,255,255,.06);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 7px;
          text-align: center;
        }

        .bd-info-card strong {
          color: #f5b942;
          font-size: 16px;
          overflow-wrap: anywhere;
        }

        .bd-info-card span {
          color: rgba(245,240,232,.5);
          font-size: 10px;
        }

        /* BOOK DETAILS */

        .bd-eyebrow {
          color: #f5b942;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .bd-content h1 {
          margin-top: 12px;
          font-family: Georgia, serif;
          font-size: clamp(36px,4.2vw,58px);
          line-height: 1.12;
        }

        .bd-author {
          color: #f5b942;
          margin-top: 13px;
          font-size: 19px;
          font-weight: 600;
        }

        .bd-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 27px 0 30px;
        }

        .bd-tags a,
        .bd-tags span {
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 30px;
          padding: 8px 15px;
          color: rgba(245,240,232,.75);
          font-size: 11px;
          text-decoration: none;
        }

        .bd-tags a:hover {
          color: #f5b942;
          border-color: #f5b942;
        }

        /* PUBLISHING */

        .bd-publishing {
          display: flex;
          flex-wrap: wrap;
          gap: 55px;
          padding: 20px 0;
          border-top: 1px solid rgba(255,255,255,.1);
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .bd-publishing div {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .bd-publishing span {
          color: rgba(245,240,232,.45);
          font-size: 11px;
        }

        .bd-publishing strong {
          font-size: 13px;
        }

        /* SYNOPSIS */

        .bd-synopsis {
          margin-top: 30px;
        }

        .bd-synopsis h2 {
          font-family: Georgia, serif;
          font-size: 23px;
          margin-bottom: 12px;
        }

        .bd-synopsis p {
          color: rgba(245,240,232,.68);
          font-size: 14px;
          line-height: 1.8;
        }

        /* RATING */

        .bd-rating-card {
          display: grid;
          grid-template-columns: 170px 1fr;
          gap: 25px;
          margin-top: 32px;
          padding: 25px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 20px;
          background: rgba(255,255,255,.07);
        }

        .bd-rating-score {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .bd-rating-score > strong {
          color: #f5b942;
          font-family: Georgia, serif;
          font-size: 62px;
          line-height: 1;
        }

        .bd-rating-stars {
          margin-top: 10px;
          color: rgba(255,255,255,.2);
          font-size: 20px;
          letter-spacing: 1px;
        }

        .bd-rating-stars .filled {
          color: #f5b942;
        }

        .bd-rating-score small {
          margin-top: 8px;
          color: rgba(245,240,232,.5);
          font-size: 11px;
        }

        .bd-rating-bars {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 13px;
        }

        .bd-rating-row {
          display: grid;
          grid-template-columns: 38px 1fr 35px;
          gap: 10px;
          align-items: center;
          font-size: 11px;
        }

        .bd-rating-row > span {
          color: #f5b942;
        }

        .bd-rating-row small {
          color: rgba(245,240,232,.5);
          text-align: right;
        }

        .bd-bar-track {
          height: 10px;
          overflow: hidden;
          border-radius: 20px;
          background: rgba(255,255,255,.13);
        }

        .bd-bar-fill {
          height: 100%;
          border-radius: inherit;
          background: #f5b942;
          transition: width .5s ease;
        }

        /* ACTION BUTTONS */

        .bd-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 27px;
        }

        .bd-primary-action,
        .bd-secondary-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 25px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .bd-primary-action {
          border: 0;
          color: #21172b;
          background: #f5b942;
        }

        .bd-secondary-action {
          color: #f5f0e8;
          border: 1px solid rgba(255,255,255,.3);
          background: transparent;
        }

        .bd-primary-action:hover {
          background: #ffd477;
        }

        .bd-secondary-action:hover {
          border-color: #f5b942;
          color: #f5b942;
        }

        /* REVIEWS AND RELATED BOOKS */

        .bd-reviews-section,
        .bd-related-section {
          margin-top: 75px;
        }

        .bd-section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .bd-section-heading h2 {
          margin-top: 8px;
          font-family: Georgia, serif;
          font-size: 30px;
        }

        .bd-section-heading > span,
        .bd-section-heading > a {
          color: rgba(245,240,232,.55);
          font-size: 11px;
          text-decoration: none;
        }

        .bd-reviews-grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 14px;
        }

        .bd-review-card {
          padding: 20px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 14px;
          background: rgba(255,255,255,.045);
        }

        .bd-review-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 12px;
        }

        .bd-review-top span {
          color: #f5b942;
          white-space: nowrap;
        }

        .bd-review-card p {
          min-height: 45px;
          margin: 18px 0;
          color: rgba(245,240,232,.65);
          font-size: 12px;
          line-height: 1.7;
        }

        .bd-review-card small {
          color: rgba(245,240,232,.4);
          font-size: 10px;
        }

        .bd-no-reviews {
          padding: 35px;
          text-align: center;
          border: 1px dashed rgba(255,255,255,.17);
          border-radius: 15px;
          color: rgba(245,240,232,.5);
          font-size: 12px;
        }

        .bd-no-reviews span {
          display: block;
          color: #f5b942;
          font-size: 30px;
          margin-bottom: 10px;
        }

        .bd-related-list {
          display: grid;
          grid-template-columns: repeat(6,minmax(0,1fr));
          gap: 20px;
        }

        .bd-related-book {
          min-width: 0;
          color: #f5f0e8;
          text-decoration: none;
        }

        .bd-related-cover {
          height: 190px;
          margin-bottom: 12px;
          overflow: hidden;
          border-radius: 7px;
          background: rgba(255,255,255,.08);
          box-shadow: 8px 10px 18px rgba(0,0,0,.2);
          transition: transform .25s ease;
        }

        .bd-related-book:hover .bd-related-cover {
          transform: translateY(-7px) rotate(-2deg);
        }

        .bd-related-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bd-related-cover span {
          display: grid;
          height: 100%;
          place-items: center;
          padding: 12px;
          text-align: center;
          font-family: Georgia, serif;
        }

        .bd-related-book strong,
        .bd-related-book small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bd-related-book strong {
          font-size: 11px;
        }

        .bd-related-book small {
          margin-top: 5px;
          color: rgba(245,240,232,.45);
          font-size: 10px;
        }

        /* FOOTER */

        .bd-footer {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 75px;
          padding-top: 25px;
          border-top: 1px solid rgba(255,255,255,.1);
          color: rgba(245,240,232,.4);
          font-size: 10px;
        }

        .bd-footer a {
          color: #f5b942;
          text-decoration: none;
        }

        /* RESPONSIVE */

        @media (max-width: 1000px) {
          .bd-main {
            grid-template-columns: minmax(260px,.75fr) minmax(0,1.4fr);
            gap: 35px;
          }

          .bd-book-scene {
            height: 420px;
          }

          .bd-book-3d {
            width: 250px;
            height: 380px;
          }

          .bd-related-list {
            grid-template-columns: repeat(4,minmax(0,1fr));
          }
        }

        @media (max-width: 800px) {
          .bd-header {
            padding: 0 5%;
          }

          .bd-header nav {
            display: none;
          }

          .bd-container {
            width: 90%;
          }

          .bd-main {
            grid-template-columns: 1fr;
            gap: 42px;
          }

          .bd-cover-column {
            max-width: 420px;
            width: 100%;
            margin: auto;
          }

          .bd-content {
            width: 100%;
          }

          .bd-reviews-grid {
            grid-template-columns: 1fr;
          }

          .bd-related-list {
            grid-template-columns: repeat(3,minmax(0,1fr));
          }

          .bd-related-cover {
            height: 160px;
          }
        }

        @media (max-width: 480px) {
          .bd-book-scene {
            height: 370px;
          }

          .bd-book-3d {
            width: 220px;
            height: 330px;
          }

          .bd-rating-card {
            grid-template-columns: 1fr;
          }

          .bd-actions > * {
            flex: 1 1 100%;
          }

          .bd-related-list {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }

          .bd-footer {
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bd-related-cover,
          .bd-bar-fill {
            transition: none;
          }
        }

      `}</style>

    </main>
  );
}