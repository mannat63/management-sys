import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Alpha Coaching — Institute Management",
  description: "A modern management platform for coaching institutes. Track students, fees, attendance, and results with ease.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  );
}
