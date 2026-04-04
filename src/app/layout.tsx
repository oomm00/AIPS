import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIPS — Adaptive Income Protection System",
  description:
    "Parametric microinsurance for Q-commerce delivery partners. Index-based payouts within 2 hours. No claims. No forms.",
  keywords: ["AIPS", "parametric insurance", "gig workers", "income protection", "Zepto", "Blinkit"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
