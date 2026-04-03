"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import AdminChatbot from "./AdminChatbot";
import NotificationPanel from "./NotificationPanel";
import { UserButton } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { Menu, Bell } from "lucide-react";
import { usePathname } from "next/navigation";

// Global Fetch Cache to reduce loading times across all panels
if (typeof window !== "undefined" && !window.__fetch_patched) {
  const originalFetch = window.fetch;
  const cache = new Map();
  window.fetch = async (url, options) => {
    const isGet = !options || !options.method || options.method.toUpperCase() === 'GET';
    const isApi = typeof url === 'string' && (url.startsWith('/api/') || url.includes('/api/'));
    const skipCache = typeof url === 'string' && (url.includes('/api/me') || url.includes('/api/chatbot'));

    if (isGet && isApi && !skipCache && (!options || options.cache !== 'no-store')) {
      if (cache.has(url)) {
        return new Response(new Blob([cache.get(url)]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const res = await originalFetch(url, options);
      if (res.ok) {
        const cloned = res.clone();
        try {
          const text = await cloned.text();
          cache.set(url, text);
        } catch(e){}
      }
      return res;
    }
    
    // Invalidate cache on mutations to keep data fresh
    if (!isGet && isApi) {
      cache.clear();
    }
    
    return originalFetch(url, options);
  };
  window.__fetch_patched = true;
}

export default function DashboardLayoutClient({ children, role, userName }) {
  const pathname = usePathname();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Default sidebar open on desktop (>=768px), closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  const pageLabels = {
    "/dashboard": "Dashboard",
    "/students": "Students",
    "/teachers": "Teachers",
    "/courses": "Courses",
    "/batches": "Batches",
    "/fees": "Fees",
    "/attendance": "Attendance",
    "/attendance-calendar": "Calendar",
    "/tests": "Tests & Results",
    "/reports": "Reports",
    "/automation": "Settings",
  };
  const currentPageLabel = pageLabels[pathname] || "Dashboard";

  // On mobile, close sidebar when route changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <div className="flex h-screen bg-[#f5f6f8] overflow-hidden">
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 bg-white md:bg-transparent md:relative md:z-auto flex-shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar
          role={role}
          userName={userName}
          onClose={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          }}
          onOpenNotification={() => {
            setIsNotifOpen(true);
            setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '8px', padding: '12px 16px', fontSize: '13px', fontWeight: '500', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', color: '#1f2937' },
        }} />

        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — hidden on desktop */}
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors md:hidden"
            >
              <Menu size={22} />
            </button>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden md:block" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:inline">Live Dashboard</span>
            <span className="text-sm font-bold text-gray-800 md:hidden">{currentPageLabel}</span>
          </div>
          <div className="flex items-center gap-4">
            {role !== "STUDENT" && role !== "TEACHER" && (
              <button
                onClick={() => setIsNotifOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-sm"
              >
                <Bell size={16} />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Alerts</span>
              </button>
            )}
            <div className="text-xs font-medium text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 w-full max-w-full overflow-x-hidden overflow-y-auto">
          {children}
        </main>

        <AdminChatbot role={role} />
        <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      </div>
    </div>
  );
}
