"use server";

import { withTransaction } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";
import { allocateAvailableCopiesToReservations } from "@/lib/reservasi/allocate";
import { revalidatePath } from "next/cache";

/**
 * Pemrosesan kedaluwarsa manual. Jalankan oleh admin/pegawai dari halaman reservasi
 * atau ketika mengelola antrean. Tidak membutuhkan cron.
 */
export async function processExpiredReservations() {
  const user = await getActiveUser(["admin", "librarian"]);
  const result = await withTransaction(async (client) => {
    const books = await client.query(`
      SELECT DISTINCT book_id
      FROM book_reservations
      WHERE status = 'siap_diambil' AND pickup_deadline <= NOW()
      ORDER BY book_id
    `);
    let expired = 0;
    let allocated = 0;
    for (const row of books.rows) {
      const result = await allocateAvailableCopiesToReservations(client, row.book_id, user.id);
      expired += result.expired;
      allocated += result.allocated;
    }
    return { expired, allocated };
  });
  revalidatePath("/admin/reservasi");
  revalidatePath("/pegawai/reservasi");
  revalidatePath("/mahasiswa/reservasi");
  revalidatePath("/mahasiswa/katalog");
  return { success: true, ...result };
}
