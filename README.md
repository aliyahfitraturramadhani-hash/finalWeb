# 📚 BOOKLYN — Library Management System

**Perpustakaan kampus yang rapi, cepat, dan transparan.**

BOOKLYN adalah aplikasi manajemen perpustakaan berbasis web yang dikembangkan dengan **Next.js**, **Tailwind CSS**, dan **PostgreSQL**. Aplikasi ini mengelola koleksi buku, peminjaman bertingkat, perpanjangan, denda keterlambatan, reservasi buku, ulasan, dan pengumuman perpustakaan.

BOOKLYN menerapkan sistem multi-role: **Admin**, **Pegawai Perpustakaan (Librarian)**, **Mahasiswa (Member)**, dan **Guest**.

---

## 📑 Daftar Isi

1. [Latar Belakang](#1-latar-belakang)
2. [Tujuan Pengembangan](#2-tujuan-pengembangan)
3. [Teknologi yang Digunakan](#3-teknologi-yang-digunakan)
4. [Jenis Pengguna dan Hak Akses](#4-jenis-pengguna-dan-hak-akses)
5. [Fitur Utama](#5-fitur-utama)
6. [Struktur Database](#6-struktur-database)
7. [Cara Menjalankan Project (Panduan Lengkap)](#7-cara-menjalankan-project-panduan-lengkap)
8. [Akun Demo](#8-akun-demo)
9. [Struktur Folder Project](#9-struktur-folder-project)
10. [Alur Penggunaan Sistem](#10-alur-penggunaan-sistem)
11. [Troubleshooting](#11-troubleshooting)
12. [Catatan Penting](#12-catatan-penting)

---

## 1. Latar Belakang

Layanan perpustakaan kampus sering menghadapi masalah pencatatan peminjaman manual, keterlambatan pengembalian yang sulit dipantau, dan antrean buku yang tidak transparan. BOOKLYN dikembangkan untuk mengintegrasikan semua proses tersebut dalam satu sistem: mulai dari pendaftaran anggota, katalog, peminjaman, pengembalian, denda, hingga pengumuman operasional.

## 2. Tujuan Pengembangan

- Membangun sistem manajemen perpustakaan berbasis web.
- Mempermudah Pegawai mengelola buku, eksemplar, pengumuman, dan transaksi.
- Mempermudah Mahasiswa menelusuri katalog, meminjam, memperpanjang, dan mereservasi buku.
- Menghitung denda keterlambatan secara otomatis dan memblokir peminjaman baru jika denda belum lunas.
- Menerapkan autentikasi dan otorisasi berdasarkan role.
- Menjaga konsistensi data stok dengan transaksi database PostgreSQL (`BEGIN`, `COMMIT`, `ROLLBACK`).

## 3. Teknologi yang Digunakan

| Teknologi | Kegunaan |
|---|---|
| Next.js (App Router, Server Actions) | Framework utama aplikasi |
| React.js | Membangun komponen antarmuka |
| JavaScript (JSX) | Bahasa pemrograman aplikasi |
| Tailwind CSS v4 | Styling dan desain responsif |
| PostgreSQL | Penyimpanan data |
| `pg` (node-postgres) + Raw SQL | Koneksi dan query database |
| `bcryptjs` | Hashing dan verifikasi password |
| `jose` | Session berbasis JWT (disimpan di cookie `httpOnly`) |
| Node.js | Runtime JavaScript |
| Git & GitHub | Version control |

---

## 4. Jenis Pengguna dan Hak Akses

### 👑 Admin
- Dashboard statistik: total judul, total eksemplar, mahasiswa terdaftar, transaksi aktif, dan denda lunas.
- Mengelola pengguna (Admin, Pegawai, Mahasiswa), termasuk status akun.
- Mengelola kategori buku.
- Mengelola buku dan pengumuman.
- Memantau seluruh transaksi, reservasi, dan laporan.

### 🧑‍💼 Pegawai Perpustakaan (Librarian)
- Mengelola buku dan stok eksemplar (CRUD).
- Mengelola pengumuman operasional (CRUD).
- Memvalidasi pengajuan peminjaman (Approve / Reject), serah-terima buku, dan konfirmasi pengembalian.
- Memvalidasi pengajuan perpanjangan.
- Mencatat denda (belum dibayar → lunas).
- Memproses reservasi buku.

### 🎓 Mahasiswa (Member)
- Menelusuri katalog dan membaca pengumuman.
- Mengajukan peminjaman dan perpanjangan.
- Mereservasi buku yang stoknya sedang habis.
- Memantau peminjaman aktif, riwayat, denda, dan notifikasi.
- Memberi rating dan ulasan pada buku yang sudah selesai dipinjam.

### 👤 Guest
- Melihat homepage, katalog, detail buku, dan pengumuman publik.
- Harus login sebagai Mahasiswa untuk meminjam atau mengulas.

---

## 5. Fitur Utama

- **Authentication & Authorization**  registrasi (email kampus `.ac.id`), login, logout, dan pembatasan halaman berdasarkan role.
- **Manajemen Buku**  data buku, kategori (multi-kategori per buku), eksemplar fisik dengan kode unik (contoh `BKL-0009-01`), sampul buku (upload JPG/PNG/WebP maks. 5 MB).
- **Peminjaman bertingkat** — `Menunggu Konfirmasi` → `Menunggu Pengambilan` → `Sedang Dipinjam` → `Selesai` (atau `Ditolak` / `Dibatalkan`).
- **Perpanjangan**  pengajuan oleh mahasiswa, persetujuan/penolakan oleh pegawai.
- **Denda otomatis**  dihitung saat pengembalian berdasarkan hari terlambat × tarif per hari; mahasiswa dengan denda belum lunas tidak bisa meminjam lagi.
- **Reservasi buku**  antrean untuk buku yang stoknya habis, dengan batas waktu pengambilan.
- **Ulasan & rating**  skala 1–5, hanya untuk buku dengan transaksi selesai.
- **Pengumuman**  kategori Operational / Service / Event, status draft / published / archived.
- **Notifikasi mahasiswa**  pengingat dan informasi transaksi.
- **Laporan Admin**  rekap transaksi dan denda.
- **Buku populer**  5 buku terpopuler di homepage berdasarkan jumlah peminjaman.

---

## 6. Struktur Database

BOOKLYN menggunakan PostgreSQL dengan 13 tabel:

| Tabel | Fungsi |
|---|---|
| `users` | Akun, role, status, dan nomor identitas |
| `members` | Data keanggotaan mahasiswa |
| `categories` | Kategori buku |
| `book_categories` | Relasi buku ↔ kategori (many-to-many) |
| `books` | Data buku, durasi maks. pinjam, tarif denda |
| `book_copies` | Eksemplar fisik buku |
| `loans` | Transaksi peminjaman |
| `loan_items` | Eksemplar yang dipinjam per transaksi |
| `fines` | Denda keterlambatan |
| `reviews` | Rating dan ulasan |
| `announcements` | Pengumuman perpustakaan |
| `extension_requests` | Pengajuan perpanjangan |
| `book_reservations` | Reservasi/antrean buku |

---

## 7. Cara Menjalankan Project (Panduan Lengkap)

Ikuti langkah berurutan dari atas ke bawah. Kalau ada yang gagal, lihat bagian [Troubleshooting](#11-troubleshooting).

### ✅ Langkah 0  Pastikan sudah terpasang

| Software | Cek dengan perintah | Unduh |
|---|---|---|
| Node.js (disarankan versi 20 atau lebih baru) | `node -v` | https://nodejs.org |
| npm | `npm -v` | ikut terpasang bersama Node.js |
| PostgreSQL (disarankan versi 14 atau lebih baru) | `psql --version` | https://www.postgresql.org/download |
| Git | `git --version` | https://git-scm.com |

> 💡 Saat memasang PostgreSQL kamu akan diminta membuat **password untuk user `postgres`**. **Catat password ini**, kamu akan membutuhkannya di Langkah 4 dan 5.

> 💡 **Pengguna Windows:** jika perintah `psql` tidak dikenali, tambahkan folder `bin` PostgreSQL ke PATH (contoh: `C:\Program Files\PostgreSQL\16\bin`), atau gunakan **Cara B (pgAdmin)** di Langkah 4.

---

### 📥 Langkah 1  Clone repository

```bash
git clone https://github.com/aliyahfitraturramadhani-hash/finalWeb.git
cd finalWeb
```

---

### 📦 Langkah 2  Install dependencies

```bash
npm install
```

<details>
<summary>⚠️ Jika muncul error <code>package.json</code> tidak ditemukan (klik untuk membuka)</summary>

Pastikan file `package.json` ikut di-commit ke repository. Jika benar-benar belum ada, buat dengan perintah berikut di folder project:

```bash
npm init -y
npm install next react react-dom pg bcryptjs jose
npm install -D tailwindcss @tailwindcss/postcss postcss
```

Lalu ubah bagian `"scripts"` di `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

Buat file `postcss.config.mjs` di root project:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

Buat juga file `jsconfig.json` di root project (agar alias `@/` bekerja):

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

</details>

---

### 🗄️ Langkah 3  Buat database kosong bernama `booklyn`

Pilih **salah satu** cara:

**Cara A  Terminal (`psql`)**

```bash
psql -U postgres -c "CREATE DATABASE booklyn;"
```

Masukkan password user `postgres` jika diminta.

**Cara B  pgAdmin 4**

1. Buka pgAdmin, lalu sambungkan ke server PostgreSQL.
2. Klik kanan **Databases** → **Create** → **Database...**
3. Isi **Database** dengan `booklyn` → **Save**.

---

### 🧱 Langkah 4  Import struktur tabel dan dataset (SQL)

Semua file SQL ada di folder `DataBase/`. Cara paling mudah adalah menjalankan satu file `setup_all.sql` yang otomatis menjalankan seluruh file SQL dengan urutan yang benar.

**Cara A  Terminal (paling mudah, disarankan)**

Masuk **ke dalam folder `DataBase`** terlebih dahulu (ini penting karena `setup_all.sql` memakai path relatif):

```bash
cd DataBase
psql -U postgres -d booklyn -f setup_all.sql
cd ..
```

Jika berhasil, kamu akan melihat rangkaian pesan `>> 1/14 ...` sampai `>> SELESAI. Database BOOKLYN siap dipakai.`

**Cara B  pgAdmin 4 (tanpa terminal)**

Buka **Query Tool** pada database `booklyn` (klik kanan database → **Query Tool**), lalu buka dan jalankan file-file berikut **satu per satu, sesuai urutan** (ikon ▶ atau tekan `F5`):

| Urutan | File | Isi |
|:-:|---|---|
| 1 | `DataBase/booklyn.sql` | 9 tabel inti + akun awal + 8 buku contoh |
| 2 | `DataBase/02_additional_tables.sql` | Tabel `announcements` dan `extension_requests` |
| 3 | `DataBase/03_seed_books.sql` | 25 buku + 50 eksemplar |
| 4 | `DataBase/04_book_categories.sql` | Kategori tambahan + relasi `book_categories` |
| 5 | `DataBase/05_booklyn_migration.sql` | Kolom durasi/denda, constraint, status pinjam |
| 6 | `DataBase/06_loan_status_migration.sql` | Status peminjaman tambahan |
| 7 | `DataBase/migrations/20261123_create_book_reservations.sql` | Tabel `book_reservations` |
| 8 | `DataBase/migrations/20261123_reservation_copy_assignment.sql` | Kolom `copy_id` reservasi |
| 9 | `DataBase/migrations/20261123_reservation_copy_guard.sql` | Guard eksemplar reservasi |
| 10 | `DataBase/migrations/20261125_move_nomor_identitas_to_users.sql` | Kolom `nomor_identitas` di `users` |
| 11 | `DataBase/07_seed_demo_member.sql` | Akun mahasiswa demo ke-2 |
| 12 | `DataBase/08_default_loan_rules.sql` | Durasi pinjam & denda default semua buku |
| 13 | `DataBase/seed/seed.sql` | Dataset demo (peminjaman, denda, ulasan, pengumuman) |
| 14 | `DataBase/09_seed_book_reservations.sql` | Dataset demo reservasi |

> ⚠️ **Jangan lewati atau menukar urutan.** Setiap file bergantung pada file sebelumnya.

> ⚠️ `booklyn.sql` berisi perintah `DROP TABLE`. Menjalankannya lagi akan **menghapus dan membuat ulang** tabel inti beserta datanya. Jangan jalankan pada database yang sudah berisi data penting.

**Cek apakah import berhasil:**

```bash
psql -U postgres -d booklyn -c "SELECT COUNT(*) AS total_buku FROM books WHERE deleted_at IS NULL;"
psql -U postgres -d booklyn -c "SELECT COUNT(*) AS total_eksemplar FROM book_copies;"
```

Hasil yang diharapkan:

| Data | Jumlah |
|---|---:|
| Buku | 32 |
| Eksemplar | 74 |
| Akun pengguna | 6 |
| Transaksi peminjaman (demo) | 13 |
| Reservasi (demo) | 8 |

> Jumlah buku 32 berasal dari 8 buku contoh di `booklyn.sql` ditambah 25 buku di `03_seed_books.sql`. Satu judul (*Laskar Pelangi*) ada di kedua file, sehingga hanya tercatat sekali.

#### 🔁 Ingin mengulang dari awal (reset database)?

`setup_all.sql` aman dijalankan berulang kali. Cukup jalankan lagi, dan semua tabel akan dibuat ulang dengan data demo yang bersih:

```bash
cd DataBase
psql -U postgres -d booklyn -f setup_all.sql
cd ..
```

> ⚠️ Semua data lama di database `booklyn` (termasuk akun yang kamu daftarkan sendiri) akan terhapus.

---

### 🔐 Langkah 5  Hubungkan aplikasi ke database (file `.env.local`)

Aplikasi membaca koneksi database dari environment variable. Buat file bernama **`.env.local`** di **root project** (sejajar dengan `package.json`).

Cara cepat: salin dari template yang sudah disediakan, lalu edit isinya.

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local

# Windows (Command Prompt)
copy .env.example .env.local
```

Atau buat manual. Isi file:

```env
DATABASE_URL=postgresql://postgres:PASSWORD_POSTGRES_KAMU@localhost:5432/booklyn
AUTH_SECRET=isi_dengan_string_acak_yang_panjang
```

Penjelasan:

| Variabel | Arti |
|---|---|
| `DATABASE_URL` | Alamat koneksi PostgreSQL. Format: `postgresql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE` |
| `AUTH_SECRET` | Kunci rahasia untuk menandatangani session login (JWT). Wajib diisi. |

**Contoh nyata** (user `postgres`, password `admin123`, port bawaan `5432`):

```env
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/booklyn
```

> 🔑 Jika password mengandung karakter khusus seperti `@`, `#`, `/`, atau `:`, ubah menjadi bentuk URL-encoded. Contoh: `@` menjadi `%40`.

**Membuat `AUTH_SECRET` acak** (jalankan lalu salin hasilnya):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> 🚫 File `.env.local` berisi data rahasia. **Jangan di-upload ke GitHub.** Pastikan `.env.local` tercantum di `.gitignore`.

---

### ▶️ Langkah 6  Jalankan aplikasi

```bash
npm run dev
```

Buka di browser:

```text
http://localhost:3000
```

Selesai! Login memakai [akun demo](#8-akun-demo) di bawah.

---

### 🏗️ Langkah 7 (Opsional) — Production build

```bash
npm run build
npm run start
```

---

## 8. Akun Demo

**Password untuk semua akun demo: `Booklyn123!`**

| Role | Email | Status | Dipakai untuk |
|---|---|---|---|
| Admin | `admin@unhas.ac.id` | active | Dashboard Admin, pengguna, kategori, laporan |
| Pegawai | `librarian@unhas.ac.id` | active | Antrean pinjam, pengembalian, denda, buku, pengumuman |
| Mahasiswa | `member@unhas.ac.id` | active | Katalog, peminjaman, denda, ulasan, reservasi |
| Mahasiswa | `mahasiswa@unhas.ac.id` | active | Mahasiswa kedua (punya riwayat & reservasi demo) |
| Mahasiswa | `pending@unhas.ac.id` | pending | Menguji halaman status akun menunggu persetujuan |
| Mahasiswa | `rejected@unhas.ac.id` | rejected | Menguji halaman status akun ditolak |

Halaman login:

```text
http://localhost:3000/login
```

> Akun ini hanya untuk demonstrasi dan pengujian lokal. **Ganti atau hapus** sebelum aplikasi dipakai di lingkungan production.

### Isi dataset demo

- **Buku:** 32 judul (Fiksi, Non-Fiksi, Sains & Teknologi, Sejarah, Anak & Remaja, dan lainnya) dengan sampul di `public/images/books/`.
- **Peminjaman:** 13 transaksi dalam berbagai status (menunggu konfirmasi, sedang dipinjam, jatuh tempo, terlambat, selesai).
- **Denda:** 3 data denda (belum dibayar, lunas, dihapuskan).
- **Perpanjangan:** 4 pengajuan (2 pending, 1 disetujui, 1 ditolak).
- **Ulasan:** 3 ulasan.
- **Pengumuman:** 7 pengumuman (published, draft, archived).
- **Reservasi:** 8 reservasi (menunggu, siap diambil, selesai, dibatalkan, kedaluwarsa).

---

## 9. Struktur Folder Project

```text
finalWeb/
├── DataBase/
│   ├── setup_all.sql                ← jalankan ini untuk import semua sekaligus
│   ├── booklyn.sql                  ← 9 tabel inti + data awal
│   ├── 02_additional_tables.sql
│   ├── 03_seed_books.sql            ← 25 buku + 50 eksemplar
│   ├── 04_book_categories.sql
│   ├── 05_booklyn_migration.sql
│   ├── 06_loan_status_migration.sql
│   ├── 07_seed_demo_member.sql
│   ├── 08_default_loan_rules.sql
│   ├── 09_seed_book_reservations.sql
│   ├── migrations/                  ← migrasi reservasi & nomor identitas
│   ├── seed/seed.sql                ← dataset demo transaksi
│   └── backups/                     ← backup lama (arsip, tidak dipakai setup)
│
├── public/
│   └── images/
│       └── books/                   ← sampul buku
│
├── src/
│   ├── proxy.js                     ← proteksi route berdasarkan role
│   ├── app/
│   │   ├── page.js                  ← homepage
│   │   ├── login/  register/        ← autentikasi
│   │   ├── katalog/                 ← katalog publik & detail buku
│   │   ├── pengumuman/              ← pengumuman publik
│   │   ├── akun/status/             ← status akun pending/ditolak
│   │   ├── admin/                   ← dashboard Admin
│   │   ├── pegawai/                 ← dashboard Pegawai
│   │   ├── mahasiswa/               ← dashboard Mahasiswa
│   │   ├── actions/                 ← Server Actions (logika + query SQL)
│   │   └── api/logout/              ← endpoint logout
│   ├── components/                  ← komponen bersama
│   └── lib/
│       ├── db.js                    ← koneksi PostgreSQL (pool + transaksi)
│       ├── auth.js                  ← session JWT
│       └── ...                      ← helper reservasi, peminjaman, pengumuman
│
├── .env.example                     ← template isi .env.local
├── .env.local                       ← dibuat sendiri, TIDAK di-upload
├── .gitignore
├── package.json
└── README.md
```

---

## 10. Alur Penggunaan Sistem

### Peminjaman
1. Mahasiswa mendaftar memakai email kampus (`.ac.id`) → akun berstatus **pending**.
2. Akun diaktifkan oleh Admin (menu Kelola Pengguna).
3. Mahasiswa memilih buku dan menekan **Ajukan Pinjam** → status **Menunggu Konfirmasi**.
4. Pegawai menyetujui di antrean (**Approve**, eksemplar ditahan) atau menolak dengan alasan (**Reject**).
5. Mahasiswa mengambil buku di meja sirkulasi → status **Sedang Dipinjam**, tanggal jatuh tempo tercatat.
6. Pegawai mengonfirmasi pengembalian → status **Selesai**, eksemplar kembali tersedia.
7. Jika terlambat, denda dihitung otomatis dan dicatat sebagai **belum dibayar**.
8. Pegawai mencatat denda **lunas** saat mahasiswa membayar di perpustakaan.
9. Mahasiswa dapat memberi rating dan ulasan.

### Perpanjangan
Mahasiswa mengajukan perpanjangan untuk buku berstatus *Sedang Dipinjam*, lalu Pegawai menyetujui (jatuh tempo bertambah) atau menolak.

### Reservasi
Jika semua eksemplar sedang dipinjam, Mahasiswa dapat masuk antrean. Saat eksemplar tersedia, reservasi menjadi **Siap Diambil** dengan batas waktu pengambilan; jika lewat, reservasi menjadi **Kedaluwarsa**.

> Pembayaran denda dilakukan langsung di perpustakaan. BOOKLYN tidak memakai payment gateway.

---

## 11. Troubleshooting

| Masalah | Penyebab & solusi |
|---|---|
| `psql` tidak dikenali | PostgreSQL belum masuk PATH. Tambahkan folder `bin` PostgreSQL ke PATH, atau gunakan pgAdmin (Cara B). |
| `password authentication failed for user "postgres"` | Password di `DATABASE_URL` atau di perintah `psql` salah. |
| `database "booklyn" does not exist` | Langkah 3 belum dilakukan. Buat database `booklyn` dulu. |
| `setup_all.sql: No such file` atau `\i` gagal | Jalankan dari **dalam folder `DataBase`** (`cd DataBase`). |
| `relation "users" does not exist` di aplikasi | SQL belum diimport ke database yang benar. Cek nama database di `DATABASE_URL`. |
| `ECONNREFUSED 127.0.0.1:5432` | Service PostgreSQL belum berjalan. Nyalakan lewat Services (Windows) atau `brew services start postgresql` / `sudo service postgresql start`. |
| Port 5432 berbeda | Sesuaikan port di `DATABASE_URL` (cek di pgAdmin → Properties server). |
| Login selalu gagal / error session | `AUTH_SECRET` di `.env.local` belum diisi. Isi, lalu **restart** `npm run dev`. |
| Perubahan `.env.local` tidak terbaca | Hentikan server (`Ctrl + C`) lalu jalankan `npm run dev` lagi. |
| Peminjaman tidak bisa disetujui: *"Durasi peminjaman buku belum ditentukan"* | Buku belum punya durasi maksimal pinjam. File `08_default_loan_rules.sql` mengisinya otomatis; untuk buku baru, isi durasi dan denda di menu Kelola Buku. |
| Daftar akun gagal | Email harus berdomain `.ac.id`, password minimal 8 karakter, dan nomor identitas hanya angka. |
| Sampul buku tidak muncul | Pastikan folder `public/images/books/` ikut ter-clone dan nama file sesuai dengan path di database. |
| Error `Failed to fetch ... from Google Fonts` | Aplikasi memuat font Playfair Display dan DM Sans dari Google Fonts, jadi butuh koneksi internet saat `npm run dev` / `npm run build`. |
| `npm run dev` error karena Tailwind / PostCSS | Pastikan `tailwindcss`, `@tailwindcss/postcss`, dan `postcss.config.mjs` ada (lihat Langkah 2). |

---

## 12. Catatan Penting

- Database menyimpan **path** sampul buku, bukan file gambarnya. Gambar ada di folder `public/`.
- Sampul yang di-upload lewat aplikasi disimpan di `public/uploads/books/` (folder dibuat otomatis).
- Folder `DataBase/backups/` berisi backup lama (format `.backup`) sebagai arsip; **setup yang disarankan memakai `setup_all.sql`**, bukan backup tersebut.
- File `DataBase/migrations/003_create_fines_table.sql` adalah versi lama tabel `fines` dan **tidak dipakai** (tabel `fines` sudah dibuat di `booklyn.sql`).
- Jangan upload `.env.local`, `node_modules/`, dan `.next/` ke GitHub.

---

## 📎 Repository

GitHub: https://github.com/aliyahfitraturramadhani-hash/finalWeb

---

**BOOKLYN — Library Management System**

Developed as an individual final project for Web Programming Practicum, 2026.
