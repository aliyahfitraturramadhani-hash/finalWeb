import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";
import ReservationPickupClient from "./ReservationPickupClient";

export default async function ReservationPickupPage() {
  await getActiveUser("librarian");

  const reservations = await query(`
    SELECT
      br.id,
      br.status,
      br.ready_at,
      br.pickup_deadline,

      br.copy_id,

      m.nomor_anggota,

      u.nama AS nama_mahasiswa,
      u.email AS email_mahasiswa,

      b.judul,
      b.penulis,

      bc.kode_eksemplar

    FROM book_reservations br

    JOIN members m
      ON m.id = br.member_id

    JOIN users u
      ON u.id = m.user_id

    JOIN books b
      ON b.id = br.book_id

    LEFT JOIN book_copies bc
      ON bc.id = br.copy_id

    WHERE br.status = 'siap_diambil'

    ORDER BY br.pickup_deadline ASC
  `);

  return (
    <ReservationPickupClient
      reservations={reservations}
    />
  );
}