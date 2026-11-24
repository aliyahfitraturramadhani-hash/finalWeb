import { getActiveUser } from "@/lib/auth";
import MahasiswaLayoutClient from "./MahasiswaLayoutClient";

export default async function MahasiswaLayout({ children }) {
  const user = await getActiveUser("member");

  return (
    <MahasiswaLayoutClient user={user}>
      {children}
    </MahasiswaLayoutClient>
  );
}