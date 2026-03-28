import Link from "next/link";
import { HeaderSignIn, HeroSignIn } from "@/components/AuthButtons";
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex flex-col">
      {/* ─── Header ─── */}
      <header className="px-8 py-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs tracking-wide">
            AC
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">Alpha Coaching</h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-none">Management Platform</p>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          {userId ? (
            <Link href="/dashboard" className="btn-primary text-sm">
              Go to Dashboard →
            </Link>
          ) : (
            <HeaderSignIn />
          )}
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 relative overflow-hidden">
        <div className="text-center max-w-2xl relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-md mb-6">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Institute Management Platform</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.15] mb-6">
            Manage your{" "}
            <span className="text-slate-700 underline decoration-slate-300 decoration-2 underline-offset-4">institute</span>{" "}
            with clarity.
          </h2>
          
          <p className="text-base text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed">
            Track students, fees, attendance, and results — all in one place. Built for modern coaching institutes with WhatsApp automation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {userId ? (
              <Link href="/dashboard" className="btn-primary text-base !px-8 !py-3">
                Open Dashboard →
              </Link>
            ) : (
              <HeroSignIn />
            )}
            <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              No setup required
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-14 grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div>
              <div className="text-2xl font-bold text-gray-900">500+</div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">11</div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">Modules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">24/7</div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">Access</div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="px-8 py-5 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p className="font-medium">© 2026 Alpha Coaching. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-600 cursor-pointer transition-colors font-medium">Privacy</span>
            <span className="hover:text-gray-600 cursor-pointer transition-colors font-medium">Terms</span>
            <span className="hover:text-gray-600 cursor-pointer transition-colors font-medium">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
