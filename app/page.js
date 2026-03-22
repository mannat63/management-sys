import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="px-6 py-4 bg-white shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-teal-600 text-white flex items-center justify-center font-bold text-xl">C</div>
          <h1 className="text-xl font-bold text-slate-800">Coaching Institute</h1>
        </div>
        <nav>
          {userId ? (
            <Link href="/dashboard" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <SignInButton mode="modal" />
          )}
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
            Manage your <span className="text-teal-600">coaching institute</span> effortlessly.
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Track students, fees, attendance, and results — all in one place with WhatsApp automation.
          </p>
          {userId ? (
            <Link href="/dashboard" className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-lg transition-colors">
              Go to Dashboard &rarr;
            </Link>
          ) : (
            <SignInButton mode="modal" />
          )}
        </div>
      </main>
    </div>
  );
}
