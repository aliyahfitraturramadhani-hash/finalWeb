import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// =========================================
// HALAMAN NOTIFIKASI MAHASISWA
// =========================================

export default async function NotifikasiMahasiswaPage() {
  const user = await getActiveUser("member");

  // =========================================
  // MENGAMBIL DATA MEMBER
  // =========================================

  const members = await query(
    `SELECT id
     FROM members
     WHERE user_id = $1`,
    [user.id]
  );

  const member = members[0];

  if (!member) {
    return (
      <div className="min-h-screen bg-[#151229] p-6 text-[#F5F0E8]">
        <h1 className="text-3xl font-bold">Notifikasi</h1>
        <p className="mt-4 text-[#A6A1BC]">
          Data keanggotaan tidak ditemukan.
        </p>
      </div>
    );
  }

  // =========================================
  // MENGAMBIL DATA PEMINJAMAN
  // =========================================

  const rows = await query(
    `
    SELECT
      l.id AS loan_id,
      l.kode_pinjam,
      l.status,
      l.created_at,
      l.batas_ambil,
      l.tanggal_pinjam,
      l.jatuh_tempo,

      li.id AS loan_item_id,
      li.tanggal_kembali,

      bc.kode_eksemplar,

      b.judul

    FROM loans l

    LEFT JOIN loan_items li
      ON li.loan_id = l.id

    LEFT JOIN book_copies bc
      ON bc.id = li.copy_id

    LEFT JOIN books b
      ON b.id = bc.book_id

    WHERE l.member_id = $1

    ORDER BY l.created_at DESC, li.id ASC
    `,
    [member.id]
  );


  // =========================================
  // MENGAMBIL DATA RESERVASI
  // =========================================

  const reservationRows = await query(
    `
    SELECT
      br.id,
      br.status,
      br.reserved_at,
      br.ready_at,
      br.pickup_deadline,
      br.completed_at,
      br.cancelled_at,
      br.expired_at,
      b.judul
    FROM book_reservations br
    JOIN books b ON b.id = br.book_id
    WHERE br.member_id = $1
    ORDER BY br.reserved_at DESC
    `,
    [member.id]
  );

  // =========================================
  // MEMBENTUK DATA NOTIFIKASI
  // =========================================

  const notifications = [];

  for (const row of rows) {
    const judulBuku = row.judul || "Buku";
    const kodePinjam = row.kode_pinjam || "-";

    // -----------------------------------------
    // MENUNGGU KONFIRMASI
    // -----------------------------------------

    if (row.status === "menunggu_konfirmasi") {
      notifications.push({
        type: "pending",
        title: "Pengajuan peminjaman sedang diproses",
        message: `Pengajuan peminjaman "${judulBuku}" sedang menunggu konfirmasi petugas.`,
        date: row.created_at,
        code: kodePinjam,
      });
    }

    // -----------------------------------------
    // MENUNGGU PENGAMBILAN
    // -----------------------------------------

    if (row.status === "menunggu_pengambilan") {
      notifications.push({
        type: "warning",
        title: "Buku menunggu pengambilan",
        message: `Buku "${judulBuku}" telah disetujui dan menunggu untuk diambil.`,
        date: row.created_at,
        code: kodePinjam,
      });
    }

    // -----------------------------------------
    // SEDANG DIPINJAM
    // -----------------------------------------

    if (row.status === "sedang_dipinjam" && row.jatuh_tempo) {
      const dueDate = new Date(row.jatuh_tempo);
      const today = new Date();

      dueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();

      const diffDays = Math.ceil(
        diffTime / (1000 * 60 * 60 * 24)
      );

      if (diffDays < 0) {
        notifications.push({
          type: "danger",
          title: "Buku melewati batas pengembalian",
          message: `Buku "${judulBuku}" telah melewati batas pengembalian. Segera hubungi petugas.`,
          date: row.jatuh_tempo,
          code: kodePinjam,
        });
      } else if (diffDays === 0) {
        notifications.push({
          type: "warning",
          title: "Pengingat pengembalian buku",
          message: `Buku "${judulBuku}" harus dikembalikan hari ini.`,
          date: row.jatuh_tempo,
          code: kodePinjam,
        });
      } else if (diffDays <= 3) {
        notifications.push({
          type: "warning",
          title: "Pengingat pengembalian buku",
          message: `Buku "${judulBuku}" harus dikembalikan dalam ${diffDays} hari.`,
          date: row.jatuh_tempo,
          code: kodePinjam,
        });
      }
    }

    // -----------------------------------------
    // PEMINJAMAN SELESAI
    // -----------------------------------------

    if (row.status === "selesai" && row.tanggal_kembali) {
      notifications.push({
        type: "success",
        title: "Pengembalian buku selesai",
        message: `Pengembalian buku "${judulBuku}" telah selesai.`,
        date: row.tanggal_kembali,
        code: kodePinjam,
      });
    }

    // -----------------------------------------
    // PENGAJUAN DITOLAK
    // -----------------------------------------

    if (row.status === "ditolak") {
      notifications.push({
        type: "danger",
        title: "Pengajuan peminjaman ditolak",
        message: `Pengajuan peminjaman "${judulBuku}" ditolak oleh petugas.`,
        date: row.created_at,
        code: kodePinjam,
      });
    }
  }


  // =========================================
  // NOTIFIKASI RESERVASI
  // =========================================

  for (const reservation of reservationRows) {
    const title = reservation.judul || "Buku";
    const code = `RES-${reservation.id}`;

    if (reservation.status === "menunggu") {
      notifications.push({
        type: "pending",
        title: "Reservasi masuk antrean",
        message: `Reservasi buku "${title}" sedang menunggu giliran.`,
        date: reservation.reserved_at,
        code,
      });
    } else if (reservation.status === "siap_diambil") {
      notifications.push({
        type: "warning",
        title: "Buku reservasi siap diambil",
        message: `Buku "${title}" sudah disiapkan. Silakan ambil sebelum batas waktu${reservation.pickup_deadline ? ` ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(reservation.pickup_deadline))}` : " yang ditentukan"}.`,
        date: reservation.ready_at || reservation.reserved_at,
        code,
      });
    } else if (reservation.status === "selesai") {
      notifications.push({
        type: "success",
        title: "Reservasi berhasil dipenuhi",
        message: `Reservasi buku "${title}" telah diproses menjadi peminjaman.`,
        date: reservation.completed_at || reservation.ready_at || reservation.reserved_at,
        code,
      });
    } else if (reservation.status === "kedaluwarsa") {
      notifications.push({
        type: "danger",
        title: "Reservasi kedaluwarsa",
        message: `Batas pengambilan reservasi buku "${title}" telah lewat. Eksemplar dapat dialokasikan kepada pemesan berikutnya.`,
        date: reservation.expired_at || reservation.pickup_deadline,
        code,
      });
    } else if (reservation.status === "dibatalkan") {
      notifications.push({
        type: "success",
        title: "Reservasi dibatalkan",
        message: `Reservasi buku "${title}" telah dibatalkan.`,
        date: reservation.cancelled_at || reservation.reserved_at,
        code,
      });
    }
  }

  // =========================================
  // URUTKAN NOTIFIKASI
  // =========================================

  const sortedNotifications = notifications.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // =========================================
  // STYLE
  // =========================================

  const styles = {
    pending: {
      border: "border-[#6D5B9B]",
      badge: "bg-[#6D5B9B]/20 text-[#B9A7E8]",
      icon: "◷",
      label: "Diproses",
    },

    warning: {
      border: "border-[#FFB82E]",
      badge: "bg-[#FFB82E]/20 text-[#FFB82E]",
      icon: "!",
      label: "Pengingat",
    },

    danger: {
      border: "border-red-500",
      badge: "bg-red-500/20 text-red-400",
      icon: "!",
      label: "Perhatian",
    },

    success: {
      border: "border-green-500",
      badge: "bg-green-500/20 text-green-400",
      icon: "✓",
      label: "Selesai",
    },
  };

  // =========================================
  // FORMAT TANGGAL
  // =========================================

  function formatDate(date) {
    if (!date) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div className="min-h-screen bg-[#151229] px-5 py-8 text-[#F5F0E8] md:px-8">

      {/* HEADER */}

      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-[#A6A1BC]">
          Member Center / Notifikasi
        </p>

        <h1 className="text-3xl font-bold">
          Notifikasi
        </h1>

        <p className="mt-2 text-sm text-[#A6A1BC]">
          Informasi, pengingat peminjaman, dan pembaruan reservasi buku kamu.
        </p>
      </div>

      {/* STATISTIK */}

      <div className="mb-8 rounded-2xl border border-white/10 bg-[#211D39] p-6">
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFB82E]/10 text-2xl text-[#FFB82E]">
            ♧
          </div>

          <div>
            <p className="text-sm text-[#A6A1BC]">
              Total notifikasi
            </p>

            <h2 className="text-3xl font-bold">
              {sortedNotifications.length}
            </h2>
          </div>

        </div>
      </div>

      {/* DAFTAR NOTIFIKASI */}

      <div className="space-y-4">

        {sortedNotifications.length > 0 ? (
          sortedNotifications.map((notification, index) => {
            const style = styles[notification.type];

            return (
              <div
                key={`${notification.code}-${notification.title}-${index}`}
                className={`rounded-2xl border ${style.border} bg-[#292443] p-5 transition hover:bg-[#30294B]`}
              >

                <div className="flex items-start gap-4">

                  {/* ICON */}

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${style.badge}`}
                  >
                    {style.icon}
                  </div>

                  {/* CONTENT */}

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-start justify-between gap-3">

                      <h3 className="font-semibold text-[#F5F0E8]">
                        {notification.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${style.badge}`}
                      >
                        {style.label}
                      </span>

                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-[#C6C0D8]">
                      {notification.message}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#A6A1BC]">

                      <span>
                        ◷ {formatDate(notification.date)}
                      </span>

                      <span>
                        ID: {notification.code}
                      </span>

                    </div>

                  </div>

                </div>

              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#211D39] px-6 py-16 text-center">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#292443] text-4xl text-[#A6A1BC]">
              ♧
            </div>

            <h3 className="text-lg font-semibold">
              Belum ada notifikasi
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#A6A1BC]">
              Notifikasi peminjaman dan reservasi akan muncul di halaman ini ketika ada pembaruan aktivitas buku kamu.
            </p>

          </div>
        )}

      </div>

    </div>
  );
}