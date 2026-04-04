import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "VC Diligence Engine",
  description: "Deal analysis and diligence pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-body min-h-screen" suppressHydrationWarning>
        <nav className="bg-navy text-white">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight">
              VC Diligence
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/compare"
                className="text-sm px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                Compare
              </Link>
              <Link
                href="/new"
                className="text-sm px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                + New Deal
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
