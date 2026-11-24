import { getActiveUser } from "@/lib/auth";
import CirculationExperience from "@/components/sirkulasi/CirculationExperience";

export default async function AdminSirkulasiPage() {
  await getActiveUser("admin");

  return (
    <CirculationExperience role="admin" />
  );
}