import { getActiveUser } from "@/lib/auth";
import PegawaiSidebar from "./PegawaiSidebar";

export default async function PegawaiLayout({ children }) {
  const user = await getActiveUser(["librarian", "admin"]);

  return (
    <div className="min-h-screen bg-[#14112B] p-0 lg:p-4">
      <div className="mx-auto flex min-h-screen max-w-[1500px] overflow-hidden bg-[#14112B] text-[#F5F0E8] shadow-xl lg:min-h-[calc(100vh-2rem)] lg:rounded-2xl">
        <div className="hidden w-[260px] shrink-0 lg:block">
          <PegawaiSidebar user={user} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="lg:hidden">
            <PegawaiSidebar user={user} />
          </div>

          <main className="min-w-0 pt-24 lg:pt-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}