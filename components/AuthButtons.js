"use client";

import { SignInButton } from "@clerk/nextjs";

export function HeaderSignIn() {
  return (
    <SignInButton mode="modal">
      <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-indigo-200/50 text-sm">
        Sign In
      </button>
    </SignInButton>
  );
}

export function HeroSignIn() {
  return (
    <SignInButton mode="modal">
      <button className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
        Get Started — Free
      </button>
    </SignInButton>
  );
}
