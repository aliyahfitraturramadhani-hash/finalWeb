"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  acceptUser,
} from "@/app/actions/users";

const EMPTY_FORM = {
  nama: "",
  email: "",
  no_hp: "",
  role: "member",
  status: "active",
  password: "",
  nomor_identitas: "",
  alasan_penolakan: "",
};

const ROLE_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "admin", label: "Admin" },
  { value: "librarian", label: "Pegawai" },
  { value: "member", label: "Mahasiswa" },
];

const ROLE_LABELS = {
  admin: "Admin",
  librarian: "Pegawai",
  member: "Mahasiswa",
};

const ROLE_COLORS = {
  admin: "bg-[#FF6B8B]/15 text-[#FF829D]",
  librarian: "bg-[#F5B544]/15 text-[#F5B544]",
  member: "bg-[#4DA3FF]/15 text-[#70B5FF]",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;


  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // LOAD USERS
  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();

      setUsers(data || []);
    } catch (err) {
      setError(err.message || "Gagal mengambil data pengguna.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // FILTER USERS
  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return users.filter((user) => {
      const matchesSearch =
        user.nama?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.nomor_identitas?.toLowerCase().includes(keyword);

      const matchesRole =
        activeRole === "all" || user.role === activeRole;

      const matchesStatus =
        activeStatus === "all" || user.status === activeStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, activeRole, activeStatus]);


  // PAGINATION
const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

const paginatedUsers = filteredUsers.slice(
  (currentPage - 1) * USERS_PER_PAGE,
  currentPage * USERS_PER_PAGE
);

const startIndex =
  filteredUsers.length === 0
    ? 0
    : (currentPage - 1) * USERS_PER_PAGE + 1;

const endIndex = Math.min(
  currentPage * USERS_PER_PAGE,
  filteredUsers.length
);


  // SUMMARY
  const totalAdmin = users.filter(
    (user) => user.role === "admin"
  ).length;

  const totalPegawai = users.filter(
    (user) => user.role === "librarian"
  ).length;

  const totalMahasiswa = users.filter(
    (user) => user.role === "member"
  ).length;

  const totalActive = users.filter(
    (user) => user.status === "active"
  ).length;

  // OPEN ADD PANEL
  function openAddPanel() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setPanelOpen(true);
  }

  // OPEN EDIT PANEL
  function openEditPanel(user) {
    setEditingId(user.id);

    setForm({
      nama: user.nama || "",
      email: user.email || "",
      no_hp: user.no_hp || "",
      role: user.role || "member",
      status: user.status || "active",
      password: "",
      nomor_identitas: user.nomor_identitas || "",
      alasan_penolakan: user.alasan_penolakan || "",
    });

    setError("");
    setPanelOpen(true);
  }

  // INPUT HANDLER
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // SUBMIT FORM
  async function handleSubmit(event) {
    event.preventDefault();

    const email = form.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.ac\.id$/i.test(email)) {
      setError("Email harus menggunakan email kampus dengan domain .ac.id.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await updateUser(editingId, form);
        setSuccess("Data pengguna berhasil diperbarui.");
      } else {
        await createUser(form);
        setSuccess("Akun pengguna berhasil ditambahkan.");
      }

      setPanelOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);

      await loadUsers();
    } catch (err) {
      setError(err.message || "Gagal menyimpan data pengguna.");
    } finally {
      setSaving(false);
    }
  }

  // DELETE USER
  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setError("");

    try {
      await deleteUser(deleteTarget.id);

      setDeleteTarget(null);
      setSuccess("Akun pengguna berhasil dihapus.");

      await loadUsers();
    } catch (err) {
      setError(err.message || "Gagal menghapus pengguna.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

// ACCEPT USER
async function handleAccept(user) {
  if (user.status !== "pending") return;

  setError("");
  setSuccess("");

  try {
    await acceptUser(user.id);

    setSuccess(`Akun ${user.nama} berhasil diterima.`);
    await loadUsers();
  } catch (err) {
    setError(err.message || "Gagal menerima akun pengguna.");
  }
}

  // FORM STYLES
  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#211C45] px-4 py-3 text-white outline-none transition focus:border-[#FF6B8B]";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-300";

return (
  <div className="min-h-screen min-w-0 bg-[#14112B] text-white">

    {/* MAIN CONTENT */}
    <main className="min-w-0 p-5 pt-20 sm:p-6 sm:pt-20 lg:p-10">

        {/* HEADER */}
        <header className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-[#FF6B8B]">
              Master Data Management
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              User Management
            </h1>

            <p className="mt-2 text-gray-400">
              Kelola akun Admin, Pegawai, dan Mahasiswa BOOKLYN.
            </p>
          </div>

          <button
            onClick={openAddPanel}
            className="w-full rounded-xl bg-[#FF6B8B] px-5 py-3 font-semibold text-[#211C45] transition hover:bg-[#ff829d] sm:w-auto"
          >
            + Tambah Akun
          </button>

        </header>

        {/* NOTIFICATIONS */}
        {success && (
          <div className="mb-6 rounded-xl border border-[#2BB5A0]/30 bg-[#2BB5A0]/10 p-4 text-[#2BB5A0]">
            {success}
          </div>
        )}

        {error && !panelOpen && (
          <div className="mb-6 rounded-xl border border-[#FF6B8B]/30 bg-[#FF6B8B]/10 p-4 text-[#FF829D]">
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {[
            {
              label: "Total Pengguna",
              value: users.length,
              color: "text-[#FF6B8B]",
            },
            {
              label: "Admin",
              value: totalAdmin,
              color: "text-[#FF829D]",
            },
            {
              label: "Pegawai",
              value: totalPegawai,
              color: "text-[#F5B544]",
            },
            {
              label: "Mahasiswa",
              value: totalMahasiswa,
              color: "text-[#4DA3FF]",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-[#211C45] p-5"
            >
              <p className="text-sm text-gray-400">
                {item.label}
              </p>

              <h2 className={`mt-3 text-3xl font-bold ${item.color}`}>
                {item.value}
              </h2>

              <p className="mt-2 text-xs text-gray-500">
                Akun terdaftar
              </p>
            </div>
          ))}

        </section>

        {/* ACTIVE ACCOUNT SUMMARY */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-[#211C45] p-5">
          <p className="text-sm text-gray-400">
            Akun Aktif
          </p>

          <div className="mt-2 flex items-end gap-3">
            <h2 className="text-3xl font-bold text-[#2BB5A0]">
              {totalActive}
            </h2>

            <span className="mb-1 text-sm text-gray-500">
              dari {users.length} pengguna
            </span>
          </div>
        </div>

        {/* SEARCH */}
        <section className="mb-6">

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama, email, atau nomor identitas..."
            className="w-full rounded-xl border border-white/10 bg-[#211C45] px-5 py-4 text-white outline-none transition focus:border-[#FF6B8B]"
          />

        </section>

        {/* ROLE FILTER */}
        <section className="mb-5">

          <p className="mb-3 text-sm text-gray-400">
            Filter berdasarkan peran
          </p>

          <div className="flex flex-wrap gap-2">

            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setActiveRole(filter.value);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  activeRole === filter.value
                    ? "bg-[#FF6B8B] text-[#211C45]"
                    : "border border-white/10 bg-[#211C45] text-gray-400 hover:bg-white/10"
                }`}
              >
                {filter.label}
              </button>
            ))}

          </div>

        </section>

        {/* STATUS FILTER */}
        <section className="mb-8 flex flex-wrap items-center gap-3">

          <label className="text-sm text-gray-400">
            Status akun:
          </label>

          <select
            value={activeStatus}
            onChange={(event) => {
              setActiveStatus(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-white/10 bg-[#211C45] px-4 py-2 text-sm text-white outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="pending">Menunggu</option>
            <option value="rejected">Ditolak</option>
            <option value="suspended">Ditangguhkan</option>
          </select>

        </section>

        {/* USER TABLE */}
        <section>

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Daftar Pengguna
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              {filteredUsers.length} akun ditemukan
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-[#211C45] p-12 text-center text-gray-400">
              Memuat data pengguna...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl bg-[#211C45] p-12 text-center text-gray-400">
              Tidak ada pengguna yang sesuai dengan pencarian.
            </div>
          ) : (

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#211C45]">

              <table className="w-full min-w-[850px] text-left">

              <thead className="border-b border-white/10 bg-white/[0.03]">

                <tr className="text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-5">Pengguna</th>
                  <th className="px-5 py-5">Peran</th>
                  <th className="px-5 py-5">NIM / ID</th>
                  <th className="px-5 py-5">Status</th>
                  <th className="px-5 py-5 text-center">Aksi</th>
                </tr>

              </thead>

                <tbody className="divide-y divide-white/10">

                  {paginatedUsers.map((user) => {
                    const isCurrentUser =
                      currentUserId !== null &&
                      String(user.id) === String(currentUserId);

                    return (
                      <tr
                        key={user.id}
                        className="transition hover:bg-white/[0.03]"
                      >

                        {/* USER INFO */}
                        <td className="px-5 py-5">

                          <p className="font-semibold">
                            {user.nama}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-[#FF6B8B]">
                                (Anda)
                              </span>
                            )}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {user.email}
                          </p>

                        </td>

                        {/* ROLE */}
                        <td className="px-5 py-5">

                          <span
                            className={`rounded-full px-3 py-2 text-xs font-semibold ${
                              ROLE_COLORS[user.role] ||
                              "bg-white/10 text-gray-300"
                            }`}
                          >
                            {ROLE_LABELS[user.role] || user.role}
                          </span>

                        </td>

                        {/* IDENTITY */}
                        <td className="px-5 py-5 text-sm text-gray-400">
                          {user.nomor_identitas || "-"}
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-5">

                          <span
                            className={`rounded-full px-3 py-2 text-xs font-medium ${
                              user.status === "active"
                                ? "bg-[#2BB5A0]/15 text-[#2BB5A0]"
                                : user.status === "pending"
                                  ? "bg-[#F5B544]/15 text-[#F5B544]"
                                  : user.status === "rejected"
                                    ? "bg-[#FF6B8B]/15 text-[#FF829D]"
                                    : "bg-gray-500/15 text-gray-400"
                            }`}
                          >
                            {{
                              active: "Aktif",
                              pending: "Menunggu",
                              rejected: "Ditolak",
                              suspended: "Ditangguhkan",
                            }[user.status] || user.status}
                          </span>

                        </td>

{/* ACTIONS */}
<td className="px-5 py-5">
  <div className="grid grid-cols-3 items-center gap-2">

    {/* ACCEPT */}
    <div className="flex justify-center">
      {user.status === "pending" ? (
        <button
          onClick={() => handleAccept(user)}
          className="rounded-lg bg-[#2BB5A0]/15 px-3 py-2 text-sm font-medium text-[#2BB5A0] transition hover:bg-[#2BB5A0]/25"
        >
          Accept
        </button>
      ) : (
        <span className="invisible rounded-lg px-3 py-2 text-sm">
          Accept
        </span>
      )}
    </div>

    {/* EDIT */}
    <div className="flex justify-center">
      <button
        onClick={() => openEditPanel(user)}
        disabled={isCurrentUser}
        className="rounded-lg bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Edit
      </button>
    </div>

    {/* DELETE */}
    <div className="flex justify-center">
      <button
        onClick={() => setDeleteTarget(user)}
        disabled={isCurrentUser}
        className="rounded-lg bg-[#FF6B8B]/10 px-3 py-2 text-sm text-[#FF829D] transition hover:bg-[#FF6B8B]/20 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Hapus
      </button>
    </div>

  </div>
</td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

{/* PAGINATION */}
{!loading && filteredUsers.length > 0 && (
  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

    {/* DATA INFORMATION */}
    <p className="text-sm text-gray-400">
      Menampilkan{" "}
      <span className="font-medium text-white">
        {startIndex}-{endIndex}
      </span>{" "}
      dari{" "}
      <span className="font-medium text-white">
        {filteredUsers.length}
      </span>{" "}
      pengguna
    </p>

    {/* PAGE BUTTONS */}
    {totalPages > 1 && (
      <div className="flex flex-wrap items-center gap-2">

        {/* PREVIOUS */}
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="rounded-lg border border-white/10 bg-[#211C45] px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ←
        </button>

        {/* PAGE NUMBERS */}
        {Array.from({ length: totalPages }, (_, index) => index + 1)
          .map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                currentPage === page
                  ? "bg-[#FF6B8B] text-[#211C45]"
                  : "border border-white/10 bg-[#211C45] text-gray-400 hover:bg-white/10"
              }`}
            >
              {page}
            </button>
          ))}

        {/* NEXT */}
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="rounded-lg border border-white/10 bg-[#211C45] px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          →
        </button>

      </div>
    )}

  </div>
)}


        </section>

      </main>

      {/* ADD / EDIT PANEL */}
      <div
        className={`fixed inset-0 z-40 ${
          panelOpen ? "visible" : "invisible"
        }`}
      >

        <div
          onClick={() => !saving && setPanelOpen(false)}
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
              <p className="text-xs uppercase tracking-widest text-[#FF6B8B]">
                User Management
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {editingId ? "Edit Akun" : "Tambah Akun"}
              </h2>
            </div>

            <button
              onClick={() => setPanelOpen(false)}
              disabled={saving}
              className="rounded-xl bg-white/10 px-4 py-2 text-gray-300 hover:bg-white/20"
            >
              ✕
            </button>

          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">

            {error && (
              <div className="rounded-xl border border-[#FF6B8B]/30 bg-[#FF6B8B]/10 p-4 text-sm text-[#FF829D]">
                {error}
              </div>
            )}

            {/* NAME */}
            <div>
              <label className={labelClass}>
                Nama Lengkap *
              </label>

              <input
                name="nama"
                value={form.nama}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Masukkan nama lengkap"
                className={inputClass}
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className={labelClass}>
                Email *
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                maxLength={150}
                placeholder="nama@kampus.ac.id"
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-400">
                Gunakan email kampus dengan domain .ac.id.
              </p>
            </div>

            {/* PHONE */}
            <div>
              <label className={labelClass}>
                Nomor HP
              </label>

              <input
                name="no_hp"
                value={form.no_hp}
                onChange={handleChange}
                maxLength={20}
                placeholder="08xxxxxxxxxx"
                className={inputClass}
              />
            </div>

            {/* ROLE */}
            <div>
              <label className={labelClass}>
                Peran Pengguna *
              </label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="admin">Admin</option>
                <option value="librarian">Pegawai Perpustakaan</option>
                <option value="member">Mahasiswa</option>
              </select>
            </div>

            {/* NOMOR IDENTITAS */}
            <div>
              <label className={labelClass}>
                Nomor Identitas *
              </label>

              <input
                name="nomor_identitas"
                value={form.nomor_identitas}
                onChange={handleChange}
                maxLength={30}
                required
                placeholder="Masukkan nomor identitas"
                className={inputClass}
              />
            </div>

            {/* STATUS */}
            <div>
              <label className={labelClass}>
                Status Akun *
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="active">Aktif</option>
                <option value="pending">Menunggu</option>
                <option value="rejected">Ditolak</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>

            {/* REJECTION REASON */}
            {form.status === "rejected" && (
              <div>
                <label className={labelClass}>
                  Alasan Penolakan *
                </label>

                <textarea
                  name="alasan_penolakan"
                  value={form.alasan_penolakan}
                  onChange={handleChange}
                  required
                  rows={3}
                  className={inputClass}
                  placeholder="Tuliskan alasan penolakan..."
                />
              </div>
            )}

            {/* PASSWORD */}
            <div>
              <label className={labelClass}>
                {editingId
                  ? "Password Baru (Opsional)"
                  : "Password *"}
              </label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required={!editingId}
                minLength={8}
                autoComplete="new-password"
                placeholder={
                  editingId
                    ? "Kosongkan jika tidak ingin mengubah password"
                    : "Minimal 8 karakter"
                }
                className={inputClass}
              />

              {editingId && (
                <p className="mt-2 text-xs text-gray-500">
                  Password lama tidak ditampilkan. Isi hanya jika ingin menggantinya.
                </p>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 border-t border-white/10 pt-6">

              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-white/10 py-3 text-gray-300 transition hover:bg-white/5"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-[#FF6B8B] py-3 font-semibold text-[#211C45] transition hover:bg-[#ff829d] disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Akun"}
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

            <h2 className="text-xl font-bold">
              Hapus Akun Pengguna?
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Kamu yakin ingin menghapus akun{" "}
              <span className="font-semibold text-white">
                {deleteTarget.nama}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="mt-7 flex gap-3">

              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/10 py-3 text-gray-300 hover:bg-white/5"
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