import { getActiveUser } from "@/lib/auth";
import CirculationExperience from "@/components/sirkulasi/CirculationExperience";

export default async function PegawaiSirkulasiPage() {
  await getActiveUser("librarian");

  return (
    <CirculationExperience role="pegawai" />
  );
}