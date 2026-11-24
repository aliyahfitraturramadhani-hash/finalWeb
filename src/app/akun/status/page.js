import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export default async function AccountStatusPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const users = await query(
    `SELECT nama, email, role, status, alasan_penolakan
     FROM users
     WHERE id = $1`,
    [session.userId]
  );

  const user = users[0];

  if (!user) {
    redirect("/login");
  }

  if (user.status === "active") {
    if (user.role === "admin") redirect("/admin");
    if (user.role === "librarian") redirect("/pegawai");
    if (user.role === "member") redirect("/mahasiswa");
  }

  if (user.status === "suspended") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F0E8] p-6">
        <div className="max-w-lg rounded-2xl bg-white p-10 text-center shadow-lg">
          <h1 className="text-3xl font-bold text-[#722F37]">
            Account Suspended
          </h1>

          <p className="mt-4 text-gray-600">
            Akun kamu sedang ditangguhkan dan tidak dapat mengakses BOOKLYN.
          </p>
        </div>
      </main>
    );
  }

  if (user.status === "pending") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F0E8] p-6">
        <div className="max-w-lg rounded-2xl bg-white p-10 text-center shadow-lg">
          <p className="text-sm tracking-[0.3em] text-[#B58A62]">
            BOOKLYN
          </p>

          <h1 className="mt-5 text-3xl font-bold text-[#722F37]">
            Your Account Is Under Review
          </h1>

          <p className="mt-4 text-gray-600">
            Halo, {user.nama}. Pendaftaran kamu sedang ditinjau oleh
            pustakawan. Silakan tunggu hingga akun disetujui.
          </p>

          <p className="mt-6 text-sm text-gray-400">
            A little corner for every story.
          </p>
        </div>
      </main>
    );
  }

  if (user.status === "rejected") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F0E8] p-6">
        <div className="max-w-lg rounded-2xl bg-white p-10 text-center shadow-lg">
          <p className="text-sm tracking-[0.3em] text-[#B58A62]">
            BOOKLYN
          </p>

          <h1 className="mt-5 text-3xl font-bold text-[#722F37]">
            Registration Rejected
          </h1>

          <p className="mt-4 text-gray-600">
            Maaf, pendaftaran akun kamu belum dapat disetujui.
          </p>

          <div className="mt-6 rounded-xl bg-[#F5F0E8] p-4 text-left">
            <p className="text-sm font-semibold text-[#722F37]">
              Alasan penolakan:
            </p>

            <p className="mt-2 text-sm text-gray-600">
              {user.alasan_penolakan || "Tidak ada alasan yang diberikan."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  redirect("/login");
}