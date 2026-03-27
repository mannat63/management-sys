import Link from "next/link";
import { HeaderSignIn, HeroSignIn } from "@/components/AuthButtons";
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      {/* ─── Header ─── */}
      <header className="px-8 py-4 bg-white/80 backdrop-blur-lg border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-500/20">
            AC
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Alpha Coaching</h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest leading-none">Management Platform</p>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          {userId ? (
            <Link href="/dashboard" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-indigo-200/50 text-sm">
              Go to Dashboard →
            </Link>
          ) : (
            <HeaderSignIn />
          )}
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-100/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-100/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-3xl"></div>
        </div>

        <div className="text-center max-w-2xl relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Institute Management Platform</span>
          </div>
          
          <h2 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
            Manage your{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">institute</span>{" "}
            with clarity.
          </h2>
          
          <p className="text-lg text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed">
            Track students, fees, attendance, and results — all in one place. Built for modern coaching institutes with WhatsApp automation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {userId ? (
              <Link href="/dashboard" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
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
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div>
              <div className="text-3xl font-black text-gray-900">500+</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Students</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900">11</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Modules</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900">24/7</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Access</div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="px-8 py-6 border-t border-gray-100 bg-white/60 backdrop-blur-sm">
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
