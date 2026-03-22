"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, GraduationCap, BookOpen, Layers, IndianRupee, CalendarCheck, Calendar, FileText, Settings, PieChart } from "lucide-react";

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
  { href: "/automation", label: "Automation", Icon: Settings },
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-sm z-10 print:hidden">
      <div className="p-6 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-md text-white flex items-center justify-center font-extrabold tracking-wider text-sm">
            AC
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">Alpha Coaching</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Menu</div>
        {links.map((link) => {
          const isActive = pathname === link.href;
          const { Icon } = link;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-teal-50 text-teal-700 shadow-sm border border-teal-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              }`}
            >
              <Icon size={18} className={isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-slate-100 bg-slate-50 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged In As</div>
          <div className="text-sm font-semibold text-slate-800 truncate" title={userName}>{userName}</div>
          <div className="inline-flex mt-1">
            <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-md uppercase tracking-wider shadow-sm">
              {role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
