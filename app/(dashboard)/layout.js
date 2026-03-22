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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role={user.role} userName={user.name} />
      <div className="flex-1 flex flex-col h-full overflow-auto relative">
        <Toaster position="top-right" />
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-3 flex items-center justify-end">
          <UserButton afterSignOutUrl="/" />
        </header>
        <main className="flex-1 px-4 md:px-8 py-6">
          {children}
        </main>
        <AdminChatbot role={user.role} />
      </div>
    </div>
  );
}
