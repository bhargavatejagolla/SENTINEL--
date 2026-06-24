import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SENTINEL-Φ | Industrial Safety OS",
  description: "AI-Powered Zero-Harm Operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* LOGO FIXED BOTTOM-LEFT - We place this here so it's on EVERY page */}
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
            <span className="text-white font-bold text-sm tracking-wider">
              SENTINEL-Φ
            </span>
          </div>
        </div>
      </body>
    </html>
  );
}
