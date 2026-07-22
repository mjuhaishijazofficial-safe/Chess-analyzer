import { getLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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

// Runs before React hydrates so the saved theme applies immediately on
// first paint instead of flashing the default "terminal" theme for a
// moment. Kept tiny and defensive (try/catch) since it runs outside
// React's control.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('chessdeeper-theme');
    if (t === 'club') {
      document.documentElement.setAttribute('data-theme', 'club');
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-bg text-fg">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
