import { getActiveUser } from "@/lib/auth";
import { getMyReservations } from "@/app/actions/mahasiswa-reservasi";
import ReservasiClient from "./ReservasiClient";

export default async function ReservasiPage() {
  await getActiveUser("member");

  const reservations = await getMyReservations();

  return <ReservasiClient reservations={reservations} />;
}