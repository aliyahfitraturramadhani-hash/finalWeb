import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";

function formatTanggal(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#151229]/50 p-4">
      <p className="text-xs text-[#A6A1BC]">{label}</p>
      <p className="mt-2 break-words font-medium text-[#F5F0E8]">
        {value || "-"}
      </p>
    </div>
  );
}

export default async function ProfilMahasiswaPage() {
  const user = await getActiveUser("member");

  const result = await query(
    `
      SELECT
        u.id AS user_id,
        u.nama,
        u.email,
        u.no_hp,
        u.created_at AS akun_dibuat,

        m.id AS member_id,
        m.nomor_anggota,
        m.nomor_identitas,
        m.alamat,
        m.masa_berlaku,
        m.created_at AS keanggotaan_dibuat

      FROM users u

      JOIN members m
        ON m.user_id = u.id

      WHERE u.id = $1
      LIMIT 1
    `,
    [user.id]
  );

  const profile = result[0];

  if (!profile) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#211D39] p-8 text-center">
        <h1 className="text-xl font-bold text-[#F5F0E8]">
          Profil tidak ditemukan
        </h1>

        <p className="mt-2 text-sm text-[#A6A1BC]">
          Data keanggotaan kamu belum tersedia.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 space-y-8 bg-[#151229] px-5 py-6 text-[#F5F0E8] md:px-8 md:py-7">
      {/* HEADER */}
      <section>
        <p className="text-sm text-[#FFB82E]">
          Member Center / Profil
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#F5F0E8]">
          Profil Saya
        </h1>

        <p className="mt-2 text-sm text-[#A6A1BC]">
          Informasi akun dan keanggotaan perpustakaan BOOKLYN.
        </p>
      </section>

      {/* PROFILE HEADER CARD */}
      <section className="overflow-hidden rounded-2xl border border-white/5 bg-[#211D39]">
        <div className="h-32 bg-gradient-to-r from-[#292443] via-[#382D57] to-[#FFB82E]/20" />

        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-[#211D39] bg-[#FFB82E] text-3xl font-bold text-[#151229] shadow-xl">
              {profile.nama?.charAt(0)?.toUpperCase() || "M"}
            </div>

            <div className="pb-1">
              <h2 className="text-2xl font-bold text-[#F5F0E8]">
                {profile.nama}
              </h2>

              <p className="mt-1 text-sm text-[#A6A1BC]">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
              Anggota Aktif
            </span>

            {profile.nomor_anggota && (
              <span className="rounded-full border border-[#FFB82E]/20 bg-[#FFB82E]/10 px-3 py-1.5 text-xs font-medium text-[#FFB82E]">
                {profile.nomor_anggota}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* PERSONAL INFORMATION */}
      <section className="rounded-2xl border border-white/5 bg-[#211D39] p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#F5F0E8]">
            Informasi Pribadi
          </h2>

          <p className="mt-1 text-sm text-[#A6A1BC]">
            Data yang digunakan untuk identitas akun kamu.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem
            label="Nama Lengkap"
            value={profile.nama}
          />

          <InfoItem
            label="Email"
            value={profile.email}
          />

          <InfoItem
            label="Nomor Handphone"
            value={profile.no_hp}
          />

          <InfoItem
            label="Nomor Identitas"
            value={profile.nomor_identitas}
          />

          <div className="md:col-span-2">
            <InfoItem
              label="Alamat"
              value={profile.alamat}
            />
          </div>
        </div>
      </section>

      {/* MEMBERSHIP INFORMATION */}
      <section className="rounded-2xl border border-white/5 bg-[#211D39] p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#F5F0E8]">
            Informasi Keanggotaan
          </h2>

          <p className="mt-1 text-sm text-[#A6A1BC]">
            Detail status dan masa berlaku keanggotaan perpustakaan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem
            label="Nomor Anggota"
            value={profile.nomor_anggota}
          />

          <InfoItem
            label="Masa Berlaku"
            value={formatTanggal(profile.masa_berlaku)}
          />

          <InfoItem
            label="Tanggal Pembuatan Akun"
            value={formatTanggal(profile.akun_dibuat)}
          />

          <InfoItem
            label="Tanggal Data Anggota Dibuat"
            value={formatTanggal(profile.keanggotaan_dibuat)}
          />
        </div>
      </section>

      {/* INFORMATION NOTICE */}
      <section className="rounded-2xl border border-[#FFB82E]/10 bg-[#FFB82E]/5 p-5">
        <div className="flex gap-4">
          <div className="text-xl">💡</div>

          <div>
            <h3 className="font-semibold text-[#FFB82E]">
              Perubahan Data Profil
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-[#A6A1BC]">
              Jika terdapat kesalahan pada informasi profil atau
              data keanggotaan, silakan hubungi petugas perpustakaan
              untuk membantu memperbarui data kamu.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}