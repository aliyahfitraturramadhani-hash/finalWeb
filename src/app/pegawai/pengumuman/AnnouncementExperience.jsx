"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
  restoreAnnouncement,
} from "@/app/actions/pegawai-pengumuman";

const CATEGORY_OPTIONS = [
  { value: "Operational", label: "Operasional" },
  { value: "Service", label: "Layanan" },
  { value: "Event", label: "Acara" },
];

const FILTER_OPTIONS = [
  { value: "semua", label: "Semua" },
  { value: "Operational", label: "Operasional" },
  { value: "Service", label: "Layanan" },
  { value: "Event", label: "Acara" },
];

function getCategoryLabel(category) {
  return (
    CATEGORY_OPTIONS.find((item) => item.value === category)?.label ||
    category ||
    "-"
  );
}

function getCategoryStyle(category) {
  switch (category) {
    case "Operational":
      return "bg-blue-500/15 text-blue-300 border-blue-400/20";
    case "Service":
      return "bg-violet-500/15 text-violet-300 border-violet-400/20";
    case "Event":
      return "bg-amber-500/15 text-amber-300 border-amber-400/20";
    default:
      return "bg-white/10 text-white/60 border-white/10";
  }
}

function getStatusStyle(status) {
  switch (status) {
    case "published":
      return "bg-emerald-500/15 text-emerald-400";
    case "archived":
      return "bg-slate-500/15 text-slate-300";
    default:
      return "bg-amber-500/15 text-amber-400";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    default:
      return "Draft";
  }
}

function formatDate(date) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getDateInputValue(date) {
  if (!date) return "";

  if (typeof date === "string") {
    return date.slice(0, 10);
  }

  return new Date(date).toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  judul: "",
  isi: "",
  kategori: "Operational",
  tanggal_rilis: "",
  status: "draft",
};

export default function AnnouncementExperience({ role = "librarian" }) {
  const [announcements, setAnnouncements] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("semua");

  const formPanelRef = useRef(null);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [errors, setErrors] = useState({});
  
    const isAdmin = role === "admin";

  const roleLabel = isAdmin
    ? "Administrator"
    : "{roleLabel}";

  const accentColor = isAdmin
    ? "#FF6B8B"
    : "#F5B544";

  const accentHoverColor = isAdmin
    ? "#FF8AA3"
    : "#FFD06D";
  // ==========================================
  // LOAD DATA
  // ==========================================
  async function loadAnnouncements() {
    try {
      const result = await getAnnouncements(keyword, categoryFilter);
      setAnnouncements(result || []);
    } catch (error) {
      showToast(error.message || "Gagal memuat pengumuman.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      loadAnnouncements();
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword, categoryFilter]);

  // ==========================================
  // TOAST
  // ==========================================
  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  // ==========================================
  // FORM
  // ==========================================
  function handleFormChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setSelectedAnnouncement(null);
    setIsEditing(false);
    setIsCreating(false);
    setErrors({});
  }

  function handleCreate() {
    resetForm();
    setIsCreating(true);

    setTimeout(() => {
      formPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function handleEdit(announcement) {
    setSelectedAnnouncement(announcement);
    setIsEditing(true);
    setIsCreating(false);

    setForm({
      judul: announcement.judul || "",
      isi: announcement.isi || "",
      kategori: announcement.kategori || "Operational",
      tanggal_rilis: getDateInputValue(announcement.tanggal_rilis),
      status: announcement.status || "draft",
    });

    setErrors({});

    setTimeout(() => {
      formPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function validateForm() {
    const newErrors = {};

    if (!form.judul.trim()) {
      newErrors.judul = "Judul wajib diisi.";
    }

    if (!form.isi.trim()) {
      newErrors.isi = "Isi pengumuman wajib diisi.";
    }

    if (!form.kategori) {
      newErrors.kategori = "Kategori wajib dipilih.";
    }

    if (!form.tanggal_rilis) {
      newErrors.tanggal_rilis = "Tanggal rilis wajib diisi.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) return;

    startTransition(async () => {
      try {
        if (isEditing && selectedAnnouncement) {
          await updateAnnouncement(selectedAnnouncement.id, form);
          showToast("Pengumuman berhasil diperbarui!");
        } else {
          await createAnnouncement(form);
          showToast("Pengumuman berhasil dibuat!");
        }

        resetForm();
        await loadAnnouncements();
      } catch (error) {
        showToast(error.message || "Gagal menyimpan pengumuman.", "error");
      }
    });
  }

  // ==========================================
  // STATUS
  // ==========================================
  async function handleToggleStatus(announcement) {
    if (announcement.status === "archived") {
      showToast(
        "Pengumuman Archived tidak dapat diubah melalui toggle.",
        "error"
      );
      return;
    }

    startTransition(async () => {
      try {
        await toggleAnnouncementStatus(announcement.id);

        showToast(
          announcement.status === "published"
            ? "Pengumuman dipindahkan ke Draft."
            : "Pengumuman berhasil dipublikasikan!"
        );

        await loadAnnouncements();

        if (selectedAnnouncement?.id === announcement.id) {
          resetForm();
        }
      } catch (error) {
        showToast(error.message || "Gagal mengubah status.", "error");
      }
    });
  }

  // ==========================================
  // RESTORE ARCHIVED
  // ==========================================
  async function handleRestore(announcement) {
    if (announcement.status !== "archived") {
      showToast("Pengumuman ini bukan arsip.", "error");
      return;
    }

    startTransition(async () => {
      try {
        await restoreAnnouncement(announcement.id);

        showToast("Pengumuman berhasil dipulihkan ke Draft!");

        if (selectedAnnouncement?.id === announcement.id) {
          resetForm();
        }

        await loadAnnouncements();
      } catch (error) {
        showToast(error.message || "Gagal memulihkan pengumuman.", "error");
      }
    });
  }

  // ==========================================
  // DELETE
  // ==========================================
  async function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      try {
        await deleteAnnouncement(deleteTarget.id);

        showToast("Pengumuman berhasil dihapus.");

        if (selectedAnnouncement?.id === deleteTarget.id) {
          resetForm();
        }

        setDeleteTarget(null);
        await loadAnnouncements();
      } catch (error) {
        showToast(error.message || "Gagal menghapus pengumuman.", "error");
      }
    });
  }

  // ==========================================
  // STATISTICS
  // ==========================================
  const publishedCount = announcements.filter(
    (item) => item.status === "published"
  ).length;

  const draftCount = announcements.filter(
    (item) => item.status === "draft"
  ).length;

  const archivedCount = announcements.filter(
    (item) => item.status === "archived"
  ).length;

  const previewAnnouncement =
    selectedAnnouncement ||
    announcements.find((item) => item.status === "published") ||
    announcements[0];

  // ==========================================
  // UI
  // ==========================================
  return (
    <main className="min-h-screen bg-[#14112B] text-[#F5F0E8]">
      <div className="mx-auto max-w-7xl space-y-7 px-5 py-8 md:px-8">

        {/* HEADER */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A6A0C0]">
              Pegawai Perpustakaan
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Kelola Pengumuman
            </h1>

            <p className="mt-2 text-sm text-[#A6A0C0]">
              Kelola informasi operasional, layanan, dan acara perpustakaan.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-[#14112B] transition"
            style={{
              backgroundColor: accentColor,
            }}
          >
            <span className="text-xl">+</span>
            Buat Pengumuman
          </button>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-[#211C45] p-5">
            <div className="text-sm text-[#A6A0C0]">
              Total Pengumuman
            </div>

            <div className="mt-2 text-3xl font-bold">
              {announcements.length}
            </div>

            <div className="mt-2 text-xs text-[#A6A0C0]">
              Pengumuman dalam hasil filter
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#211C45] p-5">
            <div className="text-sm text-[#A6A0C0]">
              Status Publikasi
            </div>

            <div className="mt-3 flex flex-wrap gap-5">
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {publishedCount}
                </div>
                <div className="text-xs text-[#A6A0C0]">
                  Published
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {draftCount}
                </div>
                <div className="text-xs text-[#A6A0C0]">
                  Draft
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-300">
                  {archivedCount}
                </div>
                <div className="text-xs text-[#A6A0C0]">
                  Archived
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER + SEARCH */}
        <div className="space-y-4 rounded-2xl border border-white/5 bg-[#211C45] p-5">
          {/* FILTER */}
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((filter) => (
              <button
                type="button"
                key={filter.value}
                onClick={() => setCategoryFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  categoryFilter === filter.value
                    ? "bg-[#F5B544] text-[#14112B]"
                    : "border border-white/10 bg-white/5 text-[#A6A0C0] hover:bg-white/10"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* SEARCH */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6A0C0]">
              ⌕
            </span>

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari judul atau isi pengumuman..."
              className="w-full rounded-xl border border-white/10 bg-[#14112B] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#77718F] focus:border-[#F5B544]/50"
            />
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">

          {/* ANNOUNCEMENT LIST */}
          <section className="overflow-hidden rounded-2xl border border-white/5 bg-[#211C45]">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Daftar Pengumuman
                </h2>

                <p className="mt-1 text-xs text-[#A6A0C0]">
                  Kelola pengumuman perpustakaan
                </p>
              </div>

              <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-[#A6A0C0]">
                {announcements.length} data
              </span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-[#A6A0C0]">
                Memuat pengumuman...
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mb-3 text-4xl">📢</div>

                <h3 className="font-semibold">
                  Belum ada pengumuman
                </h3>

                <p className="mt-2 text-sm text-[#A6A0C0]">
                  Buat pengumuman pertama untuk perpustakaan.
                </p>

                <button
                  type="button"
                  onClick={handleCreate}
                  className="mt-5 rounded-xl bg-[#F5B544] px-4 py-2.5 text-sm font-semibold text-[#14112B]"
                >
                  + Buat Pengumuman
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-5 transition ${
                      selectedAnnouncement?.id === announcement.id
                        ? "bg-white/[0.04]"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      {/* INFO */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getCategoryStyle(
                              announcement.kategori
                            )}`}
                          >
                            {getCategoryLabel(announcement.kategori)}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                              announcement.status
                            )}`}
                          >
                            {getStatusLabel(announcement.status)}
                          </span>
                        </div>

                        <h3 className="break-words font-semibold">
                          {announcement.judul}
                        </h3>

                        <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-[#A6A0C0]">
                          {announcement.isi}
                        </p>

                        <div className="mt-3 text-xs text-[#77718F]">
                          📅 {formatDate(announcement.tanggal_rilis)}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                        <button
                          type="button"
                          onClick={() => handleEdit(announcement)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium transition hover:bg-white/10"
                        >
                          ✏️ Edit
                        </button>

                        {announcement.status === "archived" ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(announcement)}
                            disabled={isPending}
                            className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-60"
                          >
                            ↺ Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(announcement)}
                            disabled={isPending}
                            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                              announcement.status === "published"
                                ? "border border-amber-400/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                : "border border-emerald-400/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                          >
                            {announcement.status === "published"
                              ? "↓ Draft"
                              : "↑ Publish"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(announcement)}
                          className="rounded-lg border border-red-400/10 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                        >
                          🗑 Hapus
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedAnnouncement(announcement)}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#A6A0C0] transition hover:bg-white/5"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* FORM PANEL */}
          <section
            ref={formPanelRef}
            className="rounded-2xl border border-white/5 bg-[#211C45]"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {isEditing
                    ? "Edit Pengumuman"
                    : isCreating
                    ? "Pengumuman Baru"
                    : "Form Pengumuman"}
                </h2>

                <p className="mt-1 text-xs text-[#A6A0C0]">
                  {isEditing
                    ? "Perbarui informasi pengumuman"
                    : "Isi detail pengumuman perpustakaan"}
                </p>
              </div>

              {(isEditing || isCreating) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#A6A0C0] hover:bg-white/5"
                >
                  Batal
                </button>
              )}
            </div>

            {!isEditing && !isCreating ? (
              <div className="p-8 text-center">
                <div className="mb-4 text-4xl">📝</div>

                <h3 className="font-semibold">
                  Siap membuat pengumuman?
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#A6A0C0]">
                  Klik tombol Buat Pengumuman untuk mengisi form,
                  atau pilih pengumuman yang ingin diedit.
                </p>

                <button
                  type="button"
                  onClick={handleCreate}
                  className="mt-5 w-full rounded-xl bg-[#F5B544] px-4 py-3 font-semibold text-[#14112B] transition hover:bg-[#ffd06d]"
                >
                  + Buat Pengumuman
                </button>
              </div>
            ) : (
              <div className="space-y-5 p-5">

                {/* JUDUL */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Judul Pengumuman
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <input
                    value={form.judul}
                    onChange={(e) =>
                      handleFormChange("judul", e.target.value)
                    }
                    maxLength={200}
                    placeholder="Masukkan judul pengumuman"
                    className={`w-full rounded-xl border bg-[#14112B] px-4 py-3 text-sm outline-none transition placeholder:text-[#77718F] ${
                      errors.judul
                        ? "border-red-400"
                        : "border-white/10 focus:border-[#F5B544]/50"
                    }`}
                  />

                  <div className="mt-1 flex justify-between">
                    {errors.judul ? (
                      <span className="text-xs text-red-400">
                        {errors.judul}
                      </span>
                    ) : (
                      <span className="text-xs text-[#77718F]">
                        Maksimal 200 karakter
                      </span>
                    )}

                    <span className="text-xs text-[#77718F]">
                      {form.judul.length}/200
                    </span>
                  </div>
                </div>

                {/* ISI */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Isi Pengumuman
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <textarea
                    value={form.isi}
                    onChange={(e) =>
                      handleFormChange("isi", e.target.value)
                    }
                    rows={6}
                    placeholder="Tuliskan isi pengumuman secara lengkap..."
                    className={`w-full resize-y rounded-xl border bg-[#14112B] px-4 py-3 text-sm leading-relaxed outline-none transition placeholder:text-[#77718F] ${
                      errors.isi
                        ? "border-red-400"
                        : "border-white/10 focus:border-[#F5B544]/50"
                    }`}
                  />

                  {errors.isi && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.isi}
                    </p>
                  )}
                </div>

                {/* KATEGORI */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Kategori
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <select
                    value={form.kategori}
                    onChange={(e) =>
                      handleFormChange("kategori", e.target.value)
                    }
                    className={`w-full rounded-xl border bg-[#14112B] px-4 py-3 text-sm outline-none ${
                      errors.kategori
                        ? "border-red-400"
                        : "border-white/10 focus:border-[#F5B544]/50"
                    }`}
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>

                  {errors.kategori && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.kategori}
                    </p>
                  )}
                </div>

                {/* TANGGAL */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Tanggal Rilis
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <input
                    type="date"
                    value={form.tanggal_rilis}
                    onChange={(e) =>
                      handleFormChange("tanggal_rilis", e.target.value)
                    }
                    className={`w-full rounded-xl border bg-[#14112B] px-4 py-3 text-sm outline-none ${
                      errors.tanggal_rilis
                        ? "border-red-400"
                        : "border-white/10 focus:border-[#F5B544]/50"
                    }`}
                  />

                  {errors.tanggal_rilis && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.tanggal_rilis}
                    </p>
                  )}
                </div>

                {/* STATUS */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Status Publikasi
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                    {/* DRAFT */}
                    <button
                      type="button"
                      onClick={() => handleFormChange("status", "draft")}
                      className={`rounded-xl border p-4 text-left transition ${
                        form.status === "draft"
                          ? "border-amber-400/50 bg-amber-500/10"
                          : "border-white/10 bg-[#14112B]"
                      }`}
                    >
                      <div className="font-semibold text-amber-400">
                        Draft
                      </div>

                      <div className="mt-1 text-xs text-[#A6A0C0]">
                        Belum ditampilkan
                      </div>
                    </button>

                    {/* PUBLISHED */}
                    <button
                      type="button"
                      onClick={() => handleFormChange("status", "published")}
                      className={`rounded-xl border p-4 text-left transition ${
                        form.status === "published"
                          ? "border-emerald-400/50 bg-emerald-500/10"
                          : "border-white/10 bg-[#14112B]"
                      }`}
                    >
                      <div className="font-semibold text-emerald-400">
                        Published
                      </div>

                      <div className="mt-1 text-xs text-[#A6A0C0]">
                        Ditampilkan publik
                      </div>
                    </button>

                    {/* ARCHIVED */}
                    <button
                      type="button"
                      onClick={() => handleFormChange("status", "archived")}
                      className={`rounded-xl border p-4 text-left transition ${
                        form.status === "archived"
                          ? "border-slate-400/50 bg-slate-500/10"
                          : "border-white/10 bg-[#14112B]"
                      }`}
                    >
                      <div className="font-semibold text-slate-300">
                        Archived
                      </div>

                      <div className="mt-1 text-xs text-[#A6A0C0]">
                        Disimpan sebagai arsip
                      </div>
                    </button>
                  </div>
                </div>

                {/* SAVE */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="w-full rounded-xl bg-[#F5B544] px-4 py-3 font-semibold text-[#14112B] transition hover:bg-[#ffd06d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending
                    ? "Menyimpan..."
                    : isEditing
                    ? "Simpan Perubahan"
                    : "Simpan Pengumuman"}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* PREVIEW */}
        <section className="rounded-2xl border border-white/5 bg-[#211C45] p-5 md:p-7">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Pratinjau di Beranda
              </h2>

              <p className="mt-1 text-sm text-[#A6A0C0]">
                Gambaran tampilan pengumuman untuk pengunjung.
              </p>
            </div>

            <span className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-[#A6A0C0]">
              Preview
            </span>
          </div>

          {!previewAnnouncement ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <div className="mb-3 text-4xl">📢</div>

              <p className="text-sm text-[#A6A0C0]">
                Belum ada pengumuman untuk ditampilkan.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl">
              <article className="overflow-hidden rounded-2xl border border-white/5 bg-[#14112B]">
                <div className="h-1.5 bg-[#F5B544]" />

                <div className="p-6 md:p-8">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getCategoryStyle(
                        previewAnnouncement.kategori
                      )}`}
                    >
                      {getCategoryLabel(previewAnnouncement.kategori)}
                    </span>

                    {previewAnnouncement.status !== "published" && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          previewAnnouncement.status === "archived"
                            ? "bg-slate-500/10 text-slate-300"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {previewAnnouncement.status === "archived"
                          ? "Preview Archived"
                          : "Preview Draft"}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold leading-tight">
                    {previewAnnouncement.judul}
                  </h3>

                  <div className="mt-3 text-xs text-[#77718F]">
                    {formatDate(previewAnnouncement.tanggal_rilis)}
                  </div>

                  <div className="mt-6 whitespace-pre-line text-sm leading-8 text-[#A6A0C0]">
                    {previewAnnouncement.isi}
                  </div>
                </div>
              </article>
            </div>
          )}
        </section>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-5 py-4 shadow-2xl ${
            toast.type === "error"
              ? "border-red-400/20 bg-[#2b1723] text-red-300"
              : "border-emerald-400/20 bg-[#172b23] text-emerald-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <span>{toast.type === "error" ? "⚠️" : "✓"}</span>

            <p className="text-sm font-medium">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#211C45] p-6 shadow-2xl">
            <div className="mb-4 text-3xl">🗑️</div>

            <h3 className="text-xl font-bold">
              Hapus Pengumuman?
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-[#A6A0C0]">
              Apakah kamu yakin ingin menghapus pengumuman{" "}
              <span className="font-semibold text-[#F5F0E8]">
                "{deleteTarget.judul}"
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/5"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}