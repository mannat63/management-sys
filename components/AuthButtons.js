"use client";

import { SignInButton } from "@clerk/nextjs";

export function HeaderSignIn() {
  return (
    <SignInButton mode="modal">
      <button className="px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md text-sm">
        Sign In
      </button>
    </SignInButton>
  );
}

export function HeroSignIn() {
  return (
    <SignInButton mode="modal">
      <button className="px-8 py-3.5 bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-bold rounded-xl text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
        Get Started — Free
      </button>
    </SignInButton>
  );
}
