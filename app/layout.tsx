import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Toolkit",
  description: "Match your resume to job descriptions and track applications.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex w-full items-center gap-6 px-4 py-3 text-sm sm:px-6 lg:px-8">
            <Link href="/" className="font-semibold">
              Resume Matcher
            </Link>
            <Link
              href="/jobs"
              className="text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Job Store
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
