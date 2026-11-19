import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "VocabRAM",
  description: "Nạp từ vựng, nhớ như RAM — Oxford 3000/5000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<div className="h-[61px] border-b border-line" />}>
          <Nav />
        </Suspense>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
