"use client";

import { useState, useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Shield, BookOpen, GraduationCap, ArrowRight, BarChart3, Users, CreditCard, CalendarCheck } from "lucide-react";

const roles = [
  { label: "Administrator", icon: Shield, color: "#4f46e5" },
  { label: "Teacher", icon: BookOpen, color: "#059669" },
  { label: "Student", icon: GraduationCap, color: "#0284c7" },
];

export default function LoginClient() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setRoleIndex((prev) => (prev + 1) % roles.length);
        setFade(true);
      }, 300);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const currentRole = roles[roleIndex];
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      {/* ─── Minimal Header ─── */}
      <header className="px-8 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a87] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            α
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-[#1a1a1a] leading-tight tracking-tight">Alpha Coaching</h1>
            <p className="text-[10px] text-[#999] font-semibold uppercase tracking-[0.18em]">Institute Management</p>
          </div>
        </div>
        <a
          href="mailto:support@alphacoaching.in"
          className="text-xs font-medium text-[#888] hover:text-[#1a1a1a] transition-colors"
        >
          Need help?
        </a>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ─── Left: Welcome + Sign In ─── */}
          <div className="max-w-md mx-auto lg:mx-0 w-full">
            <div className="mb-10">
              <h2 className="text-[42px] font-extrabold text-[#1a1a1a] leading-[1.1] tracking-tight mb-3">
                Welcome back
              </h2>
              <p className="text-[15px] text-[#888] leading-relaxed">
                Sign in to access your institute dashboard. Manage students, track attendance, and monitor performance.
              </p>
            </div>

            {/* Role Indicator */}
            <div className="mb-8">
              <div className="text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.15em] mb-3">Signing in as</div>
              <div
                className="flex items-center gap-3 transition-all duration-300"
                style={{ opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(6px)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300"
                  style={{ backgroundColor: currentRole.color + "12" }}
                >
                  <RoleIcon size={20} style={{ color: currentRole.color }} strokeWidth={2} />
                </div>
                <span className="text-lg font-bold text-[#1a1a1a] tracking-tight">{currentRole.label}</span>
              </div>

              {/* Role Dots */}
              <div className="flex items-center gap-2 mt-4">
                {roles.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => { setFade(false); setTimeout(() => { setRoleIndex(i); setFade(true); }, 150); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: i === roleIndex ? currentRole.color + "10" : "transparent",
                      color: i === roleIndex ? currentRole.color : "#bbb",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <SignInButton mode="modal">
              <button className="w-full py-3.5 bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-semibold rounded-xl text-[15px] transition-all duration-200 shadow-md shadow-[#1e3a5f]/15 hover:shadow-lg hover:shadow-[#1e3a5f]/20 flex items-center justify-center gap-2.5 group">
                Sign In to Dashboard
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignInButton>

            <p className="text-[11px] text-[#bbb] mt-4 text-center">
              Your role is automatically assigned based on your registered email.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-[#e8e6e3]"></div>
              <span className="text-[11px] font-medium text-[#bbb] uppercase tracking-wider">Platform Highlights</span>
              <div className="flex-1 h-px bg-[#e8e6e3]"></div>
            </div>

            {/* Mini Feature List */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BarChart3, label: "Real-time Analytics" },
                { icon: Users, label: "Student Management" },
                { icon: CreditCard, label: "Fee Tracking" },
                { icon: CalendarCheck, label: "Attendance System" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-[#eee]">
                  <f.icon size={15} className="text-[#1e3a5f]" strokeWidth={1.8} />
                  <span className="text-[12px] font-medium text-[#555]">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right: Visual Panel ─── */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-3xl border border-[#eee] shadow-sm p-8 relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#1e3a5f]/5 to-transparent rounded-bl-[100px]"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#1e3a5f]/3 to-transparent rounded-tr-[80px]"></div>

              {/* Dashboard Preview Card */}
              <div className="relative z-10">
                <div className="text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.15em] mb-5">Dashboard Preview</div>

                {/* Mock Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-[#faf9f7] rounded-xl p-4 border border-[#f0efed]">
                    <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider mb-1">Total Students</div>
                    <div className="text-2xl font-extrabold text-[#1a1a1a]">248</div>
                    <div className="text-[10px] font-medium text-emerald-600 mt-1">+12 this month</div>
                  </div>
                  <div className="bg-[#faf9f7] rounded-xl p-4 border border-[#f0efed]">
                    <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider mb-1">Fees Collected</div>
                    <div className="text-2xl font-extrabold text-[#1a1a1a]">₹4.2L</div>
                    <div className="text-[10px] font-medium text-emerald-600 mt-1">98% on time</div>
                  </div>
                  <div className="bg-[#faf9f7] rounded-xl p-4 border border-[#f0efed]">
                    <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider mb-1">Attendance</div>
                    <div className="text-2xl font-extrabold text-[#1a1a1a]">91%</div>
                    <div className="text-[10px] font-medium text-[#999] mt-1">30-day average</div>
                  </div>
                  <div className="bg-[#faf9f7] rounded-xl p-4 border border-[#f0efed]">
                    <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider mb-1">Tests Conducted</div>
                    <div className="text-2xl font-extrabold text-[#1a1a1a]">34</div>
                    <div className="text-[10px] font-medium text-[#999] mt-1">Across 6 batches</div>
                  </div>
                </div>

                {/* Mock Chart Area */}
                <div className="bg-[#faf9f7] rounded-xl p-5 border border-[#f0efed] mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">Weekly Attendance</div>
                    <div className="text-[10px] font-medium text-[#bbb]">Last 7 days</div>
                  </div>
                  <div className="flex items-end gap-2 h-20">
                    {[75, 88, 92, 85, 90, 94, 91].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-md transition-all duration-500"
                          style={{
                            height: `${val * 0.75}px`,
                            backgroundColor: i === 6 ? "#1e3a5f" : "#ddd",
                            opacity: i === 6 ? 1 : 0.5,
                          }}
                        ></div>
                        <span className="text-[8px] font-medium text-[#bbb]">
                          {["M", "T", "W", "T", "F", "S", "S"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#1e3a5f] flex items-center justify-center text-white text-[10px] font-bold">A</div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#1a1a1a]">Admin Access</div>
                      <div className="text-[9px] text-[#bbb] font-medium">Full system control</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-semibold text-emerald-600">System Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="px-8 md:px-12 py-4 border-t border-[#eee]">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#bbb] font-medium">© 2026 Alpha Coaching. All rights reserved.</p>
          <div className="flex items-center gap-5 text-[11px] text-[#bbb] font-medium">
            <span className="hover:text-[#888] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-[#888] cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-[#888] cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
