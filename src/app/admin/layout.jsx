import AdminSidebar from "./components/AdminSidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-[#151229] text-[#F5F0E8]">
      <AdminSidebar />

      <div className="min-h-screen min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}