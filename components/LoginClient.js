"use client";

import { useState, useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";

const roles = [
  {
    label: "Student",
    avatar: "/avatar-student.png",
    color: "#6366f1",
    desc: "Access your classes, mock tests, and performance analytics.",
  },
  {
    label: "Teacher",
    avatar: "/avatar-teacher.png",
    color: "#10b981",
    desc: "Manage study materials, track batch progress, and analyze results.",
  },
  {
    label: "Administrator",
    avatar: "/avatar-admin.png",
    color: "#f59e0b",
    desc: "Complete institutional oversight, fees, and operational reports.",
  },
];

/* Google "G" logo — official colors */
function GoogleLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function LoginClient() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setRoleIndex((prev) => (prev + 1) % roles.length);
        setFade(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = roles[roleIndex];

  return (
    <div className="login-page">
      {/* ─── Left Panel: Dark gradient background only ─── */}
      <div className="login-left">
        {/* Subtle Branding */}
        <div className="login-left-brand">
          <div className="login-left-logo">
            <img src="/logo.png" alt="Alpha Coaching" />
          </div>
          <div className="login-left-text">
            <div className="login-left-name">Alpha Coaching</div>
            <div className="login-left-sub">Academic Excellence</div>
          </div>
        </div>

        {/* Illustration: Minimalist, clean, and non-AI looking */}
        <div className="login-illustration-wrapper">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
            alt="Educational coaching"
            className="login-hero-img"
          />
        </div>
      </div>

      {/* ─── Right Panel: Login Card ─── */}
      <div className="login-right">
        <div className="login-card">
          {/* ── Rotating Avatar + Role ── */}
          <div className="login-avatar-section">
            <div
              className="login-avatar-ring"
              style={{
                borderColor: current.color + "50",
                boxShadow: `0 0 40px ${current.color}20`,
              }}
            >
              <div
                className="login-avatar-inner"
                style={{
                  opacity: fade ? 1 : 0,
                  transform: fade ? "scale(1)" : "scale(0.8)",
                }}
              >
                <img src={current.avatar} alt={current.label} className="login-avatar-img" />
              </div>
            </div>

            <div
              className="login-role-name"
              style={{
                opacity: fade ? 1 : 0,
                transform: fade ? "translateY(0)" : "translateY(8px)",
                color: current.color,
              }}
            >
              {current.label}
            </div>

            <p
              className="login-role-desc"
              style={{
                opacity: fade ? 1 : 0,
                transform: fade ? "translateY(0)" : "translateY(6px)",
              }}
            >
              {current.desc}
            </p>

            {/* Role indicator dots */}
            <div className="login-role-dots">
              {roles.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setFade(false);
                    setTimeout(() => { setRoleIndex(i); setFade(true); }, 200);
                  }}
                  className="login-role-dot"
                  style={{
                    backgroundColor: i === roleIndex ? current.color : "#d4d4d8",
                    width: i === roleIndex ? "24px" : "8px",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Sign In Section ── */}
          <div className="login-signin-section">
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">Official Access</span>
              <div className="login-divider-line" />
            </div>

            {/* Single Google Button */}
            <SignInButton mode="modal">
              <button className="login-google-btn">
                <GoogleLogo size={22} />
                <span>Continue with Google</span>
              </button>
            </SignInButton>
          </div>

          {/* Mobile branding only */}
          <div className="login-brand-mobile">
            <div className="login-brand-logo">
              <img src="/logo.png" alt="Alpha Coaching" />
            </div>
            <div>
              <div className="login-brand-name">Alpha Coaching</div>
              <div className="login-brand-tagline">Academic Excellence</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Help Center ─── */}
      <a
        href="https://wa.me/919509728788?text=Hi%2C%20I%20need%20help%20with%20Alpha%20Coaching%20System"
        target="_blank"
        rel="noopener noreferrer"
        className="login-help"
      >
        Help Center
      </a>
    </div>
  );
}
