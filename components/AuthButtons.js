"use client";

import { SignInButton } from "@clerk/nextjs";

export function HeaderSignIn() {
  return (
    <SignInButton mode="modal">
      <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-md transition-all shadow-sm hover:shadow-md hover:shadow-slate-300/50 text-sm">
        Sign In
      </button>
    </SignInButton>
  );
}

export function HeroSignIn() {
  return (
    <SignInButton mode="modal">
      <button className="px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
        Get Started — Free
      </button>
    </SignInButton>
  );
}
