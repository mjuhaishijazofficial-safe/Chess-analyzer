import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

export const SUPPORTED_LOCALES = ["en", "es", "ru", "fr", "pt", "de", "hi", "tr", "nl", "id"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !SUPPORTED_LOCALES.includes(locale as Locale)) {
    locale = DEFAULT_LOCALE;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});