"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getBooks,
  getBookCategories,
  createBook,
  updateBook,
  deleteBook,
} from "@/app/actions/books";

const emptyForm = {
  judul: "",
  isbn: "",
  penulis: "",
  penerbit: "",
  tahun_terbit: new Date().getFullYear(),
  category_ids: [],
  stok: 0,
  durasi_maksimal_pinjam_hari: 14,
  tarif_denda_harian: 15000,
  harga_pengganti: 0,
  deskripsi: "",
  sampul: "",
};

export default function BookManagementPage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [coverRemoved, setCoverRemoved] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  // ==========================================
  // LOAD DATA
  // ==========================================

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [bookData, categoryData] = await Promise.all([
        getBooks(),
        getBookCategories(),
      ]);

      setBooks(bookData);
      setCategories(categoryData);
    } catch (err) {
      setError(err.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredBooks = useMemo(() => {
    const keyword = search.toLowerCase();

    return books.filter((book) => {
      const categoryText = (book.categories || [])
        .map((category) => category.nama_kategori)
        .join(" ")
        .toLowerCase();

      return (
        book.judul?.toLowerCase().includes(keyword) ||
        book.isbn?.toLowerCase().includes(keyword) ||
        book.penulis?.toLowerCase().includes(keyword) ||
        categoryText.includes(keyword)
      );
    });
  }, [books, search]);

  // ==========================================
  // OPEN ADD PANEL
  // ==========================================

  function openAddPanel() {
  setEditingId(null);

  setForm({
    ...emptyForm,
    category_ids: [],
  });

  setCoverFile(null);
  setCoverPreview("");
  setCoverRemoved(false);

  setError("");
  setSuccess("");
  setPanelOpen(true);
}

  // ==========================================
  // OPEN EDIT PANEL
  // ==========================================

  function openEditPanel(book) {
  setEditingId(book.id);

  setForm({
    judul: book.judul || "",
    isbn: book.isbn || "",
    penulis: book.penulis || "",
    penerbit: book.penerbit || "",
    tahun_terbit: book.tahun_terbit || "",

    category_ids: Array.isArray(book.category_ids)
      ? book.category_ids.map(Number)
      : (book.categories || []).map((category) =>
          Number(category.id)
        ),

    stok: Number(book.stok_total || 0),

    durasi_maksimal_pinjam_hari:
      book.durasi_maksimal_pinjam_hari || 14,

    tarif_denda_harian:
      book.tarif_denda_harian ?? 15000,

    harga_pengganti:
      book.harga_pengganti ?? 0,

    deskripsi: book.deskripsi || "",
    sampul: book.sampul || "",
  });

  setCoverFile(null);
  setCoverPreview(book.sampul || "");
  setCoverRemoved(false);

  setError("");
  setSuccess("");
  setPanelOpen(true);
}

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

// ==========================================
// HANDLE COVER UPLOAD
// ==========================================

function handleCoverChange(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    setError("Cover harus berupa JPG, PNG, atau WebP.");
    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError("Ukuran cover maksimal 5 MB.");
    event.target.value = "";
    return;
  }

  setError("");
  setCoverFile(file);
  setCoverPreview(URL.createObjectURL(file));
  setCoverRemoved(false);
}

function handleRemoveCover() {
  setCoverFile(null);
  setCoverPreview("");
  setCoverRemoved(true);

  setForm((previous) => ({
    ...previous,
    sampul: "",
  }));
}

  // ==========================================
  // MULTIPLE CATEGORY SELECTION
  // ==========================================

  function toggleCategory(categoryId) {
    setForm((previous) => {
      const selectedIds = previous.category_ids.map(Number);
      const id = Number(categoryId);

      return {
        ...previous,
        category_ids: selectedIds.includes(id)
          ? selectedIds.filter((item) => item !== id)
          : [...selectedIds, id],
      };
    });
  }

  // ==========================================
  // SUBMIT FORM
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!coverFile && !coverPreview) {
      setError("Silakan pilih gambar sampul buku terlebih dahulu.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        category_ids: form.category_ids.map(Number),
        stok: Number(form.stok),
        tahun_terbit: Number(form.tahun_terbit),
        durasi_maksimal_pinjam_hari: Number(
          form.durasi_maksimal_pinjam_hari
        ),
        tarif_denda_harian: Number(
          form.tarif_denda_harian
        ),
        harga_pengganti: Number(form.harga_pengganti),

        cover_file: coverFile,
        cover_removed: coverRemoved,
      };

      if (editingId) {
        await updateBook(editingId, payload);
        setSuccess("Data buku berhasil diperbarui.");
      } else {
        await createBook(payload);
        setSuccess("Buku berhasil ditambahkan.");
      }

      setPanelOpen(false);
      setForm(emptyForm);

      setCoverFile(null);
      setCoverPreview("");
      setCoverRemoved(false);

      await loadData();
    } catch (err) {
      setError(err.message || "Gagal menyimpan data buku.");
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // DELETE BOOK
  // ==========================================

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      setError("");

      await deleteBook(deleteTarget.id);

      setDeleteTarget(null);
      setSuccess("Buku berhasil dihapus.");

      await loadData();
    } catch (err) {
      setError(err.message || "Buku gagal dihapus.");
      setDeleteTarget(null);
    }
  }

  // ==========================================
  // STYLING
  // ==========================================

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#211C45] px-4 py-3 text-white outline-none transition focus:border-[#F5B544]";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-300";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-[#14112B] text-white flex">

    

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main className="min-w-0 flex-1 p-6 lg:p-10">

        {/* HEADER */}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">

          <div>
            <p className="text-[#F5B544] text-sm font-medium tracking-widest uppercase">
              Collection Management
            </p>

            <h2 className="text-4xl font-bold mt-2">
              Kelola Buku
            </h2>

            <p className="text-gray-400 mt-2">
              Kelola koleksi dan stok buku perpustakaan BOOKLYN.
            </p>
          </div>

          <div className="bg-[#211C45] border border-white/10 rounded-xl px-5 py-4">

            <span className="text-gray-400 text-sm">
              Total Judul
            </span>

            <p className="text-2xl font-bold text-[#F5B544]">
              {books.length}
            </p>

          </div>

        </header>

        {/* NOTIFICATION */}

        {success && (
          <div className="mb-5 rounded-xl bg-[#2BB5A0]/10 border border-[#2BB5A0]/30 p-4 text-[#2BB5A0]">
            {success}
          </div>
        )}

        {error && !panelOpen && (
          <div className="mb-5 rounded-xl bg-[#FF6B8B]/10 border border-[#FF6B8B]/30 p-4 text-[#FF6B8B]">
            {error}
          </div>
        )}

        {/* SEARCH AND ADD */}

        <section className="flex flex-col sm:flex-row gap-4 justify-between mb-7">

          <input
            type="text"
            placeholder="Cari judul, ISBN, pengarang, atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xl bg-[#211C45] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#F5B544]"
          />

          <button
            type="button"
            onClick={openAddPanel}
            className="bg-[#F5B544] hover:bg-[#ffc75c] text-[#211C45] font-bold px-6 py-4 rounded-xl transition"
          >
            + Tambah Buku
          </button>

        </section>

        {/* ======================================
            BOOK TABLE
        ====================================== */}

        <section className="bg-[#211C45] border border-white/10 rounded-2xl overflow-hidden">

          <div className="p-6 border-b border-white/10 flex justify-between items-center">

            <div>
              <h3 className="text-xl font-semibold">
                Koleksi Buku
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                Daftar koleksi buku perpustakaan.
              </p>
            </div>

            <span className="text-sm text-gray-400">
              {filteredBooks.length} buku
            </span>

          </div>

          {loading ? (

            <div className="p-12 text-center text-gray-400">
              Memuat koleksi buku...
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-[#19152F] text-gray-400 text-xs uppercase tracking-wider">

                  <tr>
                    <th className="px-6 py-5">Buku</th>
                    <th className="px-6 py-5">Kategori</th>
                    <th className="px-6 py-5">Stok</th>
                    <th className="px-6 py-5">ISBN</th>
                    <th className="px-6 py-5 text-center">Aksi</th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-white/10">

                  {filteredBooks.map((book) => {

                    const total = Number(book.stok_total || 0);

                    const available = Number(
                      book.stok_tersedia || 0
                    );

                    const percentage =
                      total > 0
                        ? (available / total) * 100
                        : 0;

                    return (

                      <tr
                        key={book.id}
                        className="hover:bg-white/5 transition"
                      >

                        {/* BOOK INFORMATION */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-4">

                            <div className="w-12 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-[#F5B544] to-[#8A4350] flex items-center justify-center shrink-0">

                              {book.sampul ? (

                                <img
                                  src={book.sampul}
                                  alt={book.judul}
                                  className="w-full h-full object-cover"
                                />

                              ) : (

                                <span className="text-[#211C45] font-bold text-xs">
                                  BOOKLYN
                                </span>

                              )}

                            </div>

                            <div>
                              <p className="font-semibold">
                                {book.judul}
                              </p>

                              <p className="text-sm text-gray-400 mt-1">
                                {book.penulis}
                              </p>
                            </div>

                          </div>

                        </td>

                        {/* CATEGORIES */}

                        <td className="px-6 py-5 min-w-52">

                          <div className="flex flex-wrap gap-1.5">

                            {(book.categories || []).map((category) => (

                              <span
                                key={category.id}
                                className="text-xs bg-[#F5B544]/10 text-[#F5B544] px-2 py-1 rounded-md"
                              >
                                {category.nama_kategori}
                              </span>

                            ))}

                          </div>

                        </td>

                        {/* STOCK */}

                        <td className="px-6 py-5 min-w-40">

                          <div className="flex justify-between text-sm mb-2">

                            <span className={
                              available === 0
                                ? "text-[#FF6B8B]"
                                : "text-white"
                            }>
                              {available}/{total}
                            </span>

                            <span className="text-gray-500">
                              tersedia
                            </span>

                          </div>

                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">

                            <div
                              className={`h-full rounded-full ${
                                available === 0
                                  ? "bg-[#FF6B8B]"
                                  : "bg-[#2BB5A0]"
                              }`}
                              style={{
                                width: `${percentage}%`,
                              }}
                            />

                          </div>

                        </td>

                        {/* ISBN */}

                        <td className="px-6 py-5 text-sm text-gray-400">
                          {book.isbn || "-"}
                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5">

                          <div className="flex justify-center gap-2">

                            <button
                              type="button"
                              onClick={() => openEditPanel(book)}
                              className="px-3 py-2 rounded-lg bg-[#F5B544]/10 text-[#F5B544] hover:bg-[#F5B544] hover:text-[#211C45] transition text-sm"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(book)}
                              className="px-3 py-2 rounded-lg bg-[#FF6B8B]/10 text-[#FF6B8B] hover:bg-[#FF6B8B] hover:text-white transition text-sm"
                            >
                              Hapus
                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

              {!loading && filteredBooks.length === 0 && (

                <div className="p-12 text-center text-gray-400">
                  Tidak ada buku yang ditemukan.
                </div>

              )}

            </div>

          )}

        </section>

        <p className="text-gray-500 text-sm mt-5">
          BOOKLYN · Library Collection Management
        </p>

      </main>

      {/* ======================================
          SLIDE FORM PANEL
      ====================================== */}

      <div
        className={`fixed inset-0 z-40 transition ${
          panelOpen ? "visible" : "invisible"
        }`}
      >

        {/* BACKDROP */}

        <div
          onClick={() => setPanelOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity ${
            panelOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* PANEL */}

        <aside
          className={`absolute right-0 top-0 h-full w-full sm:w-[560px] bg-[#211C45] border-l border-[#F5B544]/40 shadow-2xl overflow-y-auto p-6 sm:p-8 transition-transform duration-300 ${
            panelOpen
              ? "translate-x-0"
              : "translate-x-full"
          }`}
        >

          {/* PANEL HEADER */}

          <div className="flex justify-between items-start mb-8">

            <div>
              <p className="text-[#F5B544] text-xs uppercase tracking-widest">
                Book Collection
              </p>

              <h2 className="text-2xl font-bold mt-2">
                {editingId ? "Edit Buku" : "Tambah Buku"}
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                Lengkapi informasi buku berikut.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>

          </div>

          {/* FORM ERROR */}

          {error && (

            <div className="mb-5 p-4 rounded-xl bg-[#FF6B8B]/10 border border-[#FF6B8B]/30 text-[#FF6B8B] text-sm">
              {error}
            </div>

          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* TITLE */}

            <div>
              <label className={labelClass}>
                Judul Buku *
              </label>

              <input
                name="judul"
                value={form.judul}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* ISBN */}

            <div>
              <label className={labelClass}>
                ISBN *
              </label>

              <input
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* AUTHOR AND PUBLISHER */}

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className={labelClass}>
                  Pengarang *
                </label>

                <input
                  name="penulis"
                  value={form.penulis}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Penerbit *
                </label>

                <input
                  name="penerbit"
                  value={form.penerbit}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

            </div>

            {/* YEAR */}

            <div>
              <label className={labelClass}>
                Tahun Terbit *
              </label>

              <input
                type="number"
                min="1000"
                max="2100"
                name="tahun_terbit"
                value={form.tahun_terbit}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* CATEGORIES */}

            <div>
              <label className={labelClass}>
                Kategori Buku *
              </label>

              <div className="rounded-xl border border-white/10 bg-[#211C45] overflow-hidden">

                {/* SELECTED CATEGORIES */}

                <div className="min-h-14 p-4 border-b border-white/10">

                  {form.category_ids.length > 0 ? (

                    <div className="flex flex-wrap gap-2">

                      {form.category_ids.map((categoryId) => {

                        const selectedCategory = categories.find(
                          (category) =>
                            Number(category.id) === Number(categoryId)
                        );

                        if (!selectedCategory) return null;

                        return (

                          <span
                            key={categoryId}
                            className="flex items-center gap-2 rounded-lg bg-[#F5B544]/15 text-[#F5B544] px-3 py-1.5 text-sm"
                          >
                            {selectedCategory.nama_kategori}

                            <button
                              type="button"
                              onClick={() => toggleCategory(categoryId)}
                              className="hover:text-white"
                              aria-label={`Hapus kategori ${selectedCategory.nama_kategori}`}
                            >
                              ×
                            </button>

                          </span>

                        );

                      })}

                    </div>

                  ) : (

                    <p className="text-gray-500 text-sm">
                      Pilih satu atau beberapa kategori...
                    </p>

                  )}

                </div>

                {/* CATEGORY OPTIONS */}

                <div className="max-h-52 overflow-y-auto p-2">

                  {categories.map((category) => {

                    const selected = form.category_ids
                      .map(Number)
                      .includes(Number(category.id));

                    return (

                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        aria-pressed={selected}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition ${
                          selected
                            ? "bg-[#F5B544]/15 text-[#F5B544]"
                            : "text-gray-200 hover:bg-white/5"
                        }`}
                      >

                        <span
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            selected
                              ? "bg-[#F5B544] border-[#F5B544] text-[#211C45]"
                              : "border-gray-500"
                          }`}
                        >
                          {selected && (
                            <span className="text-sm font-bold">
                              ✓
                            </span>
                          )}
                        </span>

                        <span>{category.nama_kategori}</span>

                      </button>

                    );

                  })}

                </div>

              </div>

              <p className="text-xs text-gray-400 mt-2">
                Klik kategori untuk memilih atau membatalkan pilihan.
                Kamu bisa memilih lebih dari satu kategori.
              </p>

            </div>

            {/* STOCK AND DURATION */}

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className={labelClass}>
                  Stok *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  name="stok"
                  value={form.stok}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Maks. Pinjam (hari) *
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  name="durasi_maksimal_pinjam_hari"
                  value={form.durasi_maksimal_pinjam_hari}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

            </div>

            {/* FINE */}

            <div>
              <label className={labelClass}>
                Tarif Denda per Hari (Rp) *
              </label>

              <input
                type="number"
                min="0"
                step="1"
                name="tarif_denda_harian"
                value={form.tarif_denda_harian}
                onChange={handleChange}
                className={inputClass}
                required
              />

              <p className="text-xs text-gray-500 mt-2">
                Default tarif denda BOOKLYN: Rp15.000 per hari.
              </p>
            </div>

            {/* REPLACEMENT PRICE */}

            <div>
              <label className={labelClass}>
                Harga Pengganti (Rp) *
              </label>

              <input
                type="number"
                min="0"
                step="1"
                name="harga_pengganti"
                value={form.harga_pengganti}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className={labelClass}>
                Deskripsi *
              </label>

              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                required
              />
            </div>

          {/* COVER UPLOAD */}

            <div>
              <label className={labelClass}>
                Sampul Buku *
              </label>

              {/* COVER PREVIEW */}
              {coverPreview && (
                <div className="mb-4">
                  <img
                    src={coverPreview}
                    alt="Pratinjau sampul buku"
                    className="w-32 h-44 rounded-xl object-cover border border-white/20 shadow-lg"
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    Pratinjau sampul buku
                  </p>
                </div>
              )}

              {/* FILE INPUT */}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                className="w-full rounded-xl border border-white/10 bg-[#211C45] p-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#F5B544] file:px-4 file:py-2 file:font-semibold file:text-[#211C45] hover:file:bg-[#ffc75c]"
              />

              <p className="text-xs text-gray-400 mt-2">
                Format JPG, PNG, atau WebP. Maksimal 5 MB.
              </p>

              {/* REMOVE COVER */}
              {coverPreview && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="mt-3 px-4 py-2 rounded-lg bg-[#FF6B8B]/10 text-[#FF6B8B] border border-[#FF6B8B]/20 hover:bg-[#FF6B8B] hover:text-white transition text-sm"
                >
                  Hapus Sampul
                </button>
              )}
            </div>

            {/* BUTTONS */}

            <div className="pt-5 border-t border-white/10 space-y-3">

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#F5B544] hover:bg-[#ffc75c] disabled:opacity-50 text-[#211C45] font-bold rounded-xl py-4 transition"
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Buku"}
              </button>

              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="w-full border border-white/20 hover:bg-white/5 rounded-xl py-3 transition"
              >
                Batal
              </button>

            </div>

          </form>

        </aside>

      </div>

      {/* ======================================
          DELETE CONFIRMATION
      ====================================== */}

      {deleteTarget && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">

          <div className="w-full max-w-md bg-[#211C45] border border-white/10 rounded-2xl p-7">

            <h3 className="text-xl font-bold">
              Hapus Buku?
            </h3>

            <p className="text-gray-400 mt-3 leading-relaxed">
              Apakah kamu yakin ingin menghapus

              <span className="text-white font-semibold">
                {" "}{deleteTarget.judul}
              </span>

              ? Data buku akan disembunyikan dari katalog.
            </p>

            <div className="flex gap-3 mt-7">

              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-white/20 rounded-xl py-3 hover:bg-white/5"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-[#FF6B8B] text-white font-bold rounded-xl py-3 hover:bg-[#ff5278]"
              >
                Ya, Hapus
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}