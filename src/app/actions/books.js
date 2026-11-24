"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { query, withTransaction } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";
import { uploadBookCover } from "./book-covers";

// ==========================================
// VALIDASI DATA BUKU
// ==========================================

function validateBook(data) {
  const judul = String(data.judul || "").trim();
  const isbn = String(data.isbn || "").trim();
  const penulis = String(data.penulis || "").trim();
  const penerbit = String(data.penerbit || "").trim();
  const deskripsi = String(data.deskripsi || "").trim();
  const sampul = String(data.sampul || "").trim();

  const stok = Number(data.stok);
  const tahunTerbit = Number(data.tahun_terbit);
  const durasi = Number(data.durasi_maksimal_pinjam_hari);
  const tarifDenda = Number(data.tarif_denda_harian);
  const hargaPengganti = Number(data.harga_pengganti);

  const categoryIds = [
    ...new Set(
      (Array.isArray(data.category_ids)
        ? data.category_ids
        : []
      ).map(Number)
    ),
  ];

  if (
    !judul ||
    !isbn ||
    !penulis ||
    !penerbit ||
    !deskripsi
  ) {
    throw new Error("Semua informasi buku wajib diisi.");
  }

  // Sampul boleh berupa URL eksternal atau path lokal dari upload.
  if (sampul) {
    const isLocalPath = sampul.startsWith("/uploads/books/");

    if (!isLocalPath) {
      try {
        const coverUrl = new URL(sampul);

        if (!["http:", "https:"].includes(coverUrl.protocol)) {
          throw new Error();
        }
      } catch {
        throw new Error("Lokasi gambar sampul tidak valid.");
      }
    }
  }

  if (
    categoryIds.length === 0 ||
    categoryIds.some(
      (id) => !Number.isInteger(id) || id <= 0
    )
  ) {
    throw new Error("Pilih minimal satu kategori buku.");
  }

  if (!Number.isInteger(stok) || stok < 0) {
    throw new Error("Stok harus berupa angka bulat minimal 0.");
  }

  if (
    !Number.isInteger(tahunTerbit) ||
    tahunTerbit < 1000 ||
    tahunTerbit > 2100
  ) {
    throw new Error("Tahun terbit tidak valid.");
  }

  if (!Number.isInteger(durasi) || durasi < 1) {
    throw new Error("Durasi peminjaman minimal 1 hari.");
  }

  if (!Number.isFinite(tarifDenda) || tarifDenda < 0) {
    throw new Error("Tarif denda tidak valid.");
  }

  if (!Number.isFinite(hargaPengganti) || hargaPengganti < 0) {
    throw new Error("Harga pengganti tidak valid.");
  }

  return {
    judul,
    isbn,
    penulis,
    penerbit,
    deskripsi,
    sampul,
    categoryIds,
    stok,
    tahunTerbit,
    durasi,
    tarifDenda,
    hargaPengganti,
  };
}

// ==========================================
// VALIDASI RELASI KATEGORI
// ==========================================

async function validateRelations(client, book) {
  const categories = await client.query(
    `
      SELECT id
      FROM categories
      WHERE id = ANY($1::bigint[])
    `,
    [book.categoryIds]
  );

  if (categories.rowCount !== book.categoryIds.length) {
    throw new Error("Terdapat kategori yang tidak valid.");
  }
}

// ==========================================
// REFRESH HALAMAN
// ==========================================

function refreshBookPages() {
  revalidatePath("/pegawai");
  revalidatePath("/pegawai/buku");
  revalidatePath("/admin");
  revalidatePath("/katalog");
  revalidatePath("/");
}

// ==========================================
// GET BOOKS
// ==========================================

export async function getBooks() {
  await getActiveUser(["admin", "librarian"]);

  return query(`
    SELECT
      b.*,

      COUNT(DISTINCT bc.id)::int AS stok_total,

      COUNT(DISTINCT bc.id) FILTER (
        WHERE bc.status = 'tersedia'
      )::int AS stok_tersedia,

      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', c.id,
            'nama_kategori', c.nama_kategori
          )
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::jsonb
      ) AS categories,

      COALESCE(
        array_agg(DISTINCT c.id)
          FILTER (WHERE c.id IS NOT NULL),
        ARRAY[]::bigint[]
      ) AS category_ids

    FROM books b

    LEFT JOIN book_copies bc
      ON bc.book_id = b.id

    LEFT JOIN book_categories bcat
      ON bcat.book_id = b.id

    LEFT JOIN categories c
      ON c.id = bcat.category_id

    WHERE b.deleted_at IS NULL

    GROUP BY b.id

    ORDER BY b.created_at DESC
  `);
}

// ==========================================
// GET BOOK CATEGORIES
// ==========================================

export async function getBookCategories() {
  await getActiveUser(["admin", "librarian"]);

  return query(`
    SELECT
      id,
      nama_kategori
    FROM categories
    ORDER BY nama_kategori ASC
  `);
}

// ==========================================
// CREATE BOOK
// ==========================================

export async function createBook(data) {
  await getActiveUser(["admin", "librarian"]);

  const sampul = data.cover_file
    ? await uploadBookCover(data.cover_file)
    : String(data.sampul || "").trim();

  const book = validateBook({ ...data, sampul });

  const bookId = await withTransaction(async (client) => {
    await validateRelations(client, book);

    const existingISBN = await client.query(
      `
        SELECT id
        FROM books
        WHERE isbn = $1
      `,
      [book.isbn]
    );

    if (existingISBN.rowCount > 0) {
      throw new Error("ISBN sudah digunakan oleh buku lain.");
    }

    const result = await client.query(
      `
        INSERT INTO books (
          judul,
          isbn,
          penulis,
          penerbit,
          tahun_terbit,
          deskripsi,
          sampul,
          durasi_maksimal_pinjam_hari,
          tarif_denda_harian,
          harga_pengganti
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10
        )
        RETURNING id
      `,
      [
        book.judul,
        book.isbn,
        book.penulis,
        book.penerbit,
        book.tahunTerbit,
        book.deskripsi,
        book.sampul,
        book.durasi,
        book.tarifDenda,
        book.hargaPengganti,
      ]
    );

    const newBookId = result.rows[0].id;

    // SIMPAN RELASI KATEGORI

    for (const categoryId of book.categoryIds) {
      await client.query(
        `
          INSERT INTO book_categories (
            book_id,
            category_id
          )
          VALUES ($1, $2)
        `,
        [newBookId, categoryId]
      );
    }

    // BUAT EKSEMPLAR BUKU

    for (let i = 0; i < book.stok; i++) {
      const uniqueCode =
        `BK-${newBookId}-${randomUUID()
          .slice(0, 8)
          .toUpperCase()}`;

      await client.query(
        `
          INSERT INTO book_copies (
            book_id,
            kode_eksemplar,
            kondisi,
            status
          )
          VALUES ($1, $2, 'baik', 'tersedia')
        `,
        [newBookId, uniqueCode]
      );
    }

    return newBookId;
  });

  refreshBookPages();

  return {
    success: true,
    message: "Buku berhasil ditambahkan.",
    bookId,
  };
}

// ==========================================
// UPDATE BOOK
// ==========================================

export async function updateBook(id, data) {
  await getActiveUser(["admin", "librarian"]);

  const bookId = Number(id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new Error("ID buku tidak valid.");
  }

  const sampul = data.cover_file
    ? await uploadBookCover(data.cover_file)
    : data.cover_removed
      ? ""
      : String(data.sampul || "").trim();

  const book = validateBook({ ...data, sampul });

  await withTransaction(async (client) => {
    const currentBook = await client.query(
      `
        SELECT id
        FROM books
        WHERE id = $1
          AND deleted_at IS NULL
        FOR UPDATE
      `,
      [bookId]
    );

    if (currentBook.rowCount === 0) {
      throw new Error("Buku tidak ditemukan.");
    }

    await validateRelations(client, book);

    const duplicateISBN = await client.query(
      `
        SELECT id
        FROM books
        WHERE isbn = $1
          AND id <> $2
      `,
      [book.isbn, bookId]
    );

    if (duplicateISBN.rowCount > 0) {
      throw new Error("ISBN sudah digunakan oleh buku lain.");
    }

    // CEK STOK EKSEMPLAR

    const copies = await client.query(
      `
        SELECT id, status
        FROM book_copies
        WHERE book_id = $1
        ORDER BY id
        FOR UPDATE
      `,
      [bookId]
    );

    const currentStock = copies.rowCount;
    const stockDifference = book.stok - currentStock;

    // TAMBAH EKSEMPLAR JIKA STOK BERTAMBAH

    if (stockDifference > 0) {
      for (let i = 0; i < stockDifference; i++) {
        const uniqueCode =
          `BK-${bookId}-${randomUUID()
            .slice(0, 8)
            .toUpperCase()}`;

        await client.query(
          `
            INSERT INTO book_copies (
              book_id,
              kode_eksemplar,
              kondisi,
              status
            )
            VALUES ($1, $2, 'baik', 'tersedia')
          `,
          [bookId, uniqueCode]
        );
      }
    }

    // KURANGI EKSEMPLAR JIKA STOK BERKURANG

    if (stockDifference < 0) {
      const amountToRemove = Math.abs(stockDifference);

      const removableCopies = await client.query(
        `
          SELECT bc.id
          FROM book_copies bc
          WHERE bc.book_id = $1
            AND bc.status = 'tersedia'
            AND NOT EXISTS (
              SELECT 1
              FROM loan_items li
              WHERE li.copy_id = bc.id
            )
          ORDER BY bc.id DESC
          LIMIT $2
          FOR UPDATE OF bc
        `,
        [bookId, amountToRemove]
      );

      if (removableCopies.rowCount < amountToRemove) {
        throw new Error(
          "Stok tidak dapat dikurangi sebanyak itu karena sebagian eksemplar sedang dipinjam atau memiliki riwayat transaksi."
        );
      }

      for (const copy of removableCopies.rows) {
        await client.query(
          `DELETE FROM book_copies WHERE id = $1`,
          [copy.id]
        );
      }
    }

    // UPDATE INFORMASI BUKU

    await client.query(
      `
        UPDATE books
        SET
          judul = $1,
          isbn = $2,
          penulis = $3,
          penerbit = $4,
          tahun_terbit = $5,
          deskripsi = $6,
          sampul = $7,
          durasi_maksimal_pinjam_hari = $8,
          tarif_denda_harian = $9,
          harga_pengganti = $10
        WHERE id = $11
      `,
      [
        book.judul,
        book.isbn,
        book.penulis,
        book.penerbit,
        book.tahunTerbit,
        book.deskripsi,
        book.sampul,
        book.durasi,
        book.tarifDenda,
        book.hargaPengganti,
        bookId,
      ]
    );

    // HAPUS RELASI KATEGORI LAMA

    await client.query(
      `
        DELETE FROM book_categories
        WHERE book_id = $1
      `,
      [bookId]
    );

    // SIMPAN RELASI KATEGORI BARU

    for (const categoryId of book.categoryIds) {
      await client.query(
        `
          INSERT INTO book_categories (
            book_id,
            category_id
          )
          VALUES ($1, $2)
        `,
        [bookId, categoryId]
      );
    }
  });

  refreshBookPages();

  return {
    success: true,
    message: "Data buku berhasil diperbarui.",
  };
}

// ==========================================
// DELETE BOOK (SOFT DELETE)
// ==========================================

export async function deleteBook(id) {
  await getActiveUser(["admin", "librarian"]);

  const bookId = Number(id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new Error("ID buku tidak valid.");
  }

  await withTransaction(async (client) => {
    const book = await client.query(
      `
        SELECT id
        FROM books
        WHERE id = $1
          AND deleted_at IS NULL
        FOR UPDATE
      `,
      [bookId]
    );

    if (book.rowCount === 0) {
      throw new Error("Buku tidak ditemukan.");
    }

    const activeLoans = await client.query(
      `
        SELECT l.id
        FROM loans l

        JOIN loan_items li
          ON li.loan_id = l.id

        JOIN book_copies bc
          ON bc.id = li.copy_id

        WHERE bc.book_id = $1
          AND l.status IN (
            'menunggu_konfirmasi',
            'sedang_dipinjam'
          )

        LIMIT 1
      `,
      [bookId]
    );

    if (activeLoans.rowCount > 0) {
      throw new Error(
        "Buku tidak dapat dihapus karena masih memiliki transaksi aktif."
      );
    }

    await client.query(
      `
        UPDATE books
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [bookId]
    );
  });

  refreshBookPages();

  return {
    success: true,
    message: "Buku berhasil dihapus.",
  };
}