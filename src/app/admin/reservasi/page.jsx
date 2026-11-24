import { getActiveUser } from "@/lib/auth";
import { getReservationQueue } from "@/app/actions/admin-reservasi";
import ReservationQueueClient from "./ReservationQueueClient";

export default async function AdminReservationPage() {
  await getActiveUser("admin");

  const reservations = await getReservationQueue();

  return (
    <ReservationQueueClient reservations={reservations} />
  );
}