import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteSidebar } from "@/components/site-sidebar";
import { RegisterServiceWorker } from "@/components/register-sw";
import { ThemeInit } from "@/components/theme-init";
import { SUPPORTED_LOCALES } from "@/i18n/request";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(SUPPORTED_LOCALES, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <ThemeInit />
      <RegisterServiceWorker />
      <SiteSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
