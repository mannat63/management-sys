import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import AdminChatbot from "@/components/AdminChatbot";
import { Toaster } from "react-hot-toast";

export default async function DashboardLayout({ children }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await getAuthUser();

  return (
    <div className="flex h-screen bg-[#f7f8fc] overflow-hidden">
      <Sidebar role={user.role} userName={user.name} />
      <div className="flex-1 flex flex-col h-full overflow-auto relative">
        <Toaster position="top-right" toastOptions={{
          style: {
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: '600',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          },
        }} />
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-100 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium text-gray-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="flex-1 px-4 md:px-8 py-6">
          {children}
        </main>
        <AdminChatbot role={user.role} />
      </div>
    </div>
  );
}
