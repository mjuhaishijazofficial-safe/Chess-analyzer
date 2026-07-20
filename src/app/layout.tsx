import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteSidebar } from "@/components/site-sidebar";
import { RegisterServiceWorker } from "@/components/register-sw";
import { SITE_URL } from "@/lib/site-config";

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
    default: "ChessDeeper - Chess.com analytics",
    template: "%s - ChessDeeper",
  },
  description:
    "Connect your Chess.com account and explore your profile, ratings, records and recent games in a clean analytics dashboard.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "ChessDeeper - Chess.com analytics",
    description:
      "Profile, ratings, records and recent games - powered by the Chess.com public API.",
    type: "website",
  },
  appleWebApp: {
    title: "ChessDeeper",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-bg text-fg">
        <NextIntlClientProvider locale={locale} messages={messages}>
        <RegisterServiceWorker />
        <SiteSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </NextIntlClientProvider>
      </body>
    </html>
  );
}
