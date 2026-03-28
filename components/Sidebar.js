"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, GraduationCap, BookOpen, Layers, IndianRupee, CalendarCheck, Calendar, FileText, Settings, PieChart, ChevronRight } from "lucide-react";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/students", label: "Students", Icon: Users },
  { href: "/teachers", label: "Teachers", Icon: GraduationCap },
  { href: "/courses", label: "Courses", Icon: BookOpen },
  { href: "/batches", label: "Batches", Icon: Layers },
  { href: "/fees", label: "Fees", Icon: IndianRupee },
  { href: "/attendance", label: "Attendance", Icon: CalendarCheck },
  { href: "/attendance-calendar", label: "Calendar", Icon: Calendar },
  { href: "/tests", label: "Tests & Results", Icon: FileText },
  { href: "/reports", label: "Reports", Icon: PieChart },
  { href: "/automation", label: "Automation & Settings", Icon: Settings },
];

const teacherLinks = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/batches", label: "My Batches", Icon: Layers },
  { href: "/attendance", label: "Attendance", Icon: CalendarCheck },
  { href: "/attendance-calendar", label: "Calendar", Icon: Calendar },
  { href: "/tests", label: "Results", Icon: FileText },
];

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", Icon: CalendarCheck },
  { href: "/fees", label: "Fees", Icon: IndianRupee },
  { href: "/tests", label: "Results", Icon: FileText },
  { href: "/reports", label: "My Report", Icon: PieChart },
];

const roleLinksMap = {
  ADMIN: adminLinks,
  TEACHER: teacherLinks,
  STUDENT: studentLinks,
};

export default function Sidebar({ role, userName }) {
  const pathname = usePathname();
  const links = roleLinksMap[role] || studentLinks;

  return (
    <aside className="w-[240px] bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-10 print:hidden">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs tracking-wide">
            AC
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-sm leading-tight block">Alpha Coaching</span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Management</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Navigation</div>
        {links.map((link) => {
          const isActive = pathname === link.href;
          const { Icon } = link;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 group relative ${
                isActive
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-slate-800 rounded-r-sm" />
              )}
              <Icon size={16} className={isActive ? "text-slate-700" : "text-gray-400 group-hover:text-gray-600"} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1">{link.label}</span>
              {isActive && <ChevronRight size={13} className="text-slate-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-gray-200 flex-shrink-0">
        <div className="bg-gray-50 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {(userName || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate" title={userName}>{userName}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
