"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories";


const emptyForm = {
  nama_kategori: "",
  kode_klasifikasi: "",
  deskripsi: "",
};

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // LOAD CATEGORIES
  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message || "Gagal mengambil data kategori.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // SEARCH
  const filteredCategories = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return categories.filter((category) => {
      const nama = (category.nama_kategori || "").toLowerCase();
      const kode = (category.kode_klasifikasi || "").toLowerCase();

      return nama.includes(keyword) || kode.includes(keyword);
    });
  }, [categories, search]);

  // TOTAL BOOK RELATIONS
  const totalBooks = categories.reduce(
    (total, category) =>
      total + Number(category.jumlah_buku || 0),
    0
  );

  // OPEN ADD PANEL
  function openAddPanel() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setPanelOpen(true);
  }

  // OPEN EDIT PANEL
  function openEditPanel(category) {
    setEditingId(category.id);

    setForm({
      nama_kategori: category.nama_kategori || "",
      kode_klasifikasi: category.kode_klasifikasi || "",
      deskripsi: category.deskripsi || "",
    });

    setError("");
    setSuccess("");
    setPanelOpen(true);
  }

  // HANDLE INPUT
  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  // CREATE / UPDATE
  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await updateCategory(editingId, form);
        setSuccess("Kategori berhasil diperbarui.");
      } else {
        await createCategory(form);
        setSuccess("Kategori berhasil ditambahkan.");
      }

      setPanelOpen(false);
      setForm(emptyForm);

      await loadCategories();
    } catch (err) {
      setError(err.message || "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
    }
  }

  // DELETE
  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setError("");

    try {
      await deleteCategory(deleteTarget.id);

      setDeleteTarget(null);
      setSuccess("Kategori berhasil dihapus.");

      await loadCategories();
    } catch (err) {
      setError(err.message || "Kategori gagal dihapus.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // STYLES
  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#211C45] px-4 py-3 text-white outline-none transition focus:border-[#4DA3FF]";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-300";

  const colors = [
    "from-[#4DA3FF]/20 to-[#4DA3FF]/5 border-[#4DA3FF]/30",
    "from-[#2BB5A0]/20 to-[#2BB5A0]/5 border-[#2BB5A0]/30",
    "from-[#F5B544]/20 to-[#F5B544]/5 border-[#F5B544]/30",
    "from-[#FF6B8B]/20 to-[#FF6B8B]/5 border-[#FF6B8B]/30",
    "from-purple-400/20 to-purple-400/5 border-purple-400/30",
  ];

 return (
  <div className="min-h-screen min-w-0 bg-[#14112B] text-white">
    <main className="min-w-0 p-5 pt-20 sm:p-6 sm:pt-20 lg:p-10">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10">

          <div>
            <p className="text-[#4DA3FF] text-sm font-medium tracking-widest uppercase">
              Collection Management
            </p>

            <h2 className="text-3xl sm:text-4xl font-bold mt-2">
              Category Management
            </h2>

            <p className="text-gray-400 mt-2">
              Kelola kategori dan klasifikasi koleksi buku BOOKLYN.
            </p>
          </div>

          <button
            onClick={openAddPanel}
            className="rounded-xl bg-[#4DA3FF] hover:bg-[#70b5ff] text-[#211C45] font-semibold px-5 py-3 transition w-full sm:w-auto"
          >
            + Tambah Kategori
          </button>

        </header>

        {/* SUCCESS NOTIFICATION */}
        {success && (
          <div className="mb-6 rounded-xl border border-[#2BB5A0]/30 bg-[#2BB5A0]/10 p-4 text-[#2BB5A0]">
            {success}
          </div>
        )}

        {/* ERROR NOTIFICATION */}
        {error && !panelOpen && (
          <div className="mb-6 rounded-xl border border-[#FF6B8B]/30 bg-[#FF6B8B]/10 p-4 text-[#FF6B8B]">
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">

          <div className="rounded-2xl border border-white/10 bg-[#211C45] p-6">
            <p className="text-sm text-gray-400">
              Total Kategori
            </p>

            <h3 className="text-3xl font-bold mt-3 text-[#4DA3FF]">
              {categories.length}
            </h3>

            <p className="text-xs text-gray-500 mt-2">
              Kategori terdaftar
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#211C45] p-6">
            <p className="text-sm text-gray-400">
              Total Relasi Buku
            </p>

            <h3 className="text-3xl font-bold mt-3 text-[#2BB5A0]">
              {totalBooks}
            </h3>

            <p className="text-xs text-gray-500 mt-2">
              Hubungan buku dengan kategori
            </p>
          </div>

        </section>

        {/* SEARCH */}
        <section className="mb-8">

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau kode kategori..."
            className="w-full max-w-xl rounded-xl border border-white/10 bg-[#211C45] px-5 py-4 text-white outline-none focus:border-[#4DA3FF] transition"
          />

        </section>

        {/* CATEGORY LIST */}
        <section>

          <div className="mb-6">
            <h3 className="text-xl font-bold">
              Daftar Kategori
            </h3>

            <p className="text-sm text-gray-400 mt-1">
              {filteredCategories.length} kategori ditemukan
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-[#211C45] p-12 text-center text-gray-400">
              Memuat data kategori...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="rounded-2xl bg-[#211C45] p-12 text-center text-gray-400">
              Kategori tidak ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

              {filteredCategories.map((category, index) => (
                <article
                  key={category.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${
                    colors[index % colors.length]
                  } p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
                >

                  <div className="flex items-center justify-between">

                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Book Category
                    </p>

                    <span className="rounded-xl bg-white/10 px-3 py-2 text-xs text-gray-300">
                      #{index + 1}
                    </span>

                  </div>

                  <h3 className="mt-8 text-3xl font-bold capitalize break-words">
                    {category.nama_kategori}
                  </h3>

                  <div className="mt-3">
                    <p className="text-xs text-gray-400">
                      Kode Klasifikasi
                    </p>

                    <p className="text-sm font-medium text-[#4DA3FF] mt-1">
                      {category.kode_klasifikasi || "Belum ditentukan"}
                    </p>
                  </div>

                  <p className="mt-3 text-sm text-gray-400 line-clamp-2 min-h-10">
                    {category.deskripsi || "Belum ada deskripsi kategori."}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">

                    <div>
                      <p className="text-xs text-gray-400">
                        Jumlah Relasi Buku
                      </p>

                      <p className="text-lg font-bold mt-1">
                        {Number(category.jumlah_buku || 0)}{" "}
                        <span className="text-sm font-normal text-gray-400">
                          buku
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-2">

                      <button
                        onClick={() => openEditPanel(category)}
                        className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-sm transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setDeleteTarget(category)}
                        className="rounded-lg bg-[#FF6B8B]/10 hover:bg-[#FF6B8B]/20 px-3 py-2 text-sm text-[#FF6B8B] transition"
                      >
                        Hapus
                      </button>

                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

      </main>

      {/* SLIDE PANEL */}
      <div
        className={`fixed inset-0 z-40 ${
          panelOpen ? "visible" : "invisible"
        }`}
      >

        <div
          onClick={() => setPanelOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity ${
            panelOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#14112B] p-6 shadow-2xl transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >

          <div className="flex items-center justify-between border-b border-white/10 pb-5">

            <div>
              <p className="text-xs uppercase tracking-widest text-[#4DA3FF]">
                Category Management
              </p>

              <h3 className="text-2xl font-bold mt-2">
                {editingId ? "Edit Kategori" : "Tambah Kategori"}
              </h3>
            </div>

            <button
              onClick={() => setPanelOpen(false)}
              className="rounded-xl bg-white/10 px-4 py-2 text-gray-300 hover:bg-white/20"
            >
              ✕
            </button>

          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">

            {error && (
              <div className="rounded-xl border border-[#FF6B8B]/30 bg-[#FF6B8B]/10 p-4 text-sm text-[#FF6B8B]">
                {error}
              </div>
            )}

            {/* NAMA KATEGORI */}
            <div>
              <label className={labelClass}>
                Nama Kategori *
              </label>

              <input
                type="text"
                name="nama_kategori"
                value={form.nama_kategori}
                onChange={handleChange}
                placeholder="Contoh: Fantasi"
                maxLength={100}
                required
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-500">
                Masukkan nama kategori buku.
              </p>
            </div>

            {/* KODE KLASIFIKASI */}
            <div>
              <label className={labelClass}>
                Kode Klasifikasi
              </label>

              <input
                type="text"
                name="kode_klasifikasi"
                value={form.kode_klasifikasi}
                onChange={handleChange}
                placeholder="Contoh: 800"
                maxLength={50}
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-500">
                Masukkan kode klasifikasi kategori jika sudah ditentukan.
              </p>
            </div>

            {/* DESKRIPSI */}
            <div>
              <label className={labelClass}>
                Deskripsi
              </label>

              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                placeholder="Tuliskan deskripsi singkat kategori..."
                rows={4}
                className={`${inputClass} resize-none`}
              />

              <p className="mt-2 text-xs text-gray-500">
                Berikan penjelasan singkat mengenai kategori buku.
              </p>
            </div>

            {/* PREVIEW */}
            <div className="rounded-2xl border border-white/10 bg-[#211C45] p-5">

              <p className="text-xs uppercase tracking-widest text-gray-400">
                Preview Kategori
              </p>

              <h3 className="mt-4 text-2xl font-bold text-[#4DA3FF] capitalize">
                {form.nama_kategori || "Nama Kategori"}
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                {form.kode_klasifikasi || "Kode klasifikasi belum diisi"}
              </p>

              <p className="mt-3 text-sm text-gray-500">
                {form.deskripsi || "Deskripsi kategori akan ditampilkan di sini."}
              </p>

              <p className="mt-4 text-xs text-gray-500">
                BOOKLYN Collection
              </p>

            </div>

            <div className="flex gap-3 border-t border-white/10 pt-6">

              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-gray-300 hover:bg-white/5"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-[#4DA3FF] py-3 font-semibold text-[#211C45] hover:bg-[#70b5ff] disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Kategori"}
              </button>

            </div>

          </form>

        </aside>

      </div>

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#211C45] p-7">

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF6B8B]/10 text-2xl text-[#FF6B8B]">
              !
            </div>

            <h3 className="text-xl font-bold">
              Hapus Kategori?
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Kamu yakin ingin menghapus kategori{" "}
              <span className="font-semibold text-white">
                {deleteTarget.nama_kategori}
              </span>
              ? Kategori yang masih digunakan buku tidak dapat dihapus.
            </p>

            <div className="mt-7 flex gap-3">

              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/10 py-3 text-gray-300 hover:bg-white/5 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-[#FF6B8B] py-3 font-semibold text-[#211C45] hover:bg-[#ff829d] disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}