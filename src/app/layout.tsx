import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ChessBuddy — Chess.com analytics",
    template: "%s · ChessBuddy",
  },
  description:
    "Connect your Chess.com account and explore your profile, ratings, records and recent games in a clean analytics dashboard.",
  metadataBase: new URL("https://chessbuddy.local"),
  openGraph: {
    title: "ChessBuddy — Chess.com analytics",
    description:
      "Profile, ratings, records and recent games — powered by the Chess.com public API.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
