import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PinNote",
  description: "Pin floating reference cards over any window",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className={inter.variable}>
      <body className="min-h-svh overflow-hidden bg-[var(--app-surface)]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
