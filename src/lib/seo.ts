import { SITE_URL } from "@/lib/site-config";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/i18n/request";

export function buildLanguageAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = `${SITE_URL}/${locale}${path}`;
  }
  languages["x-default"] = `${SITE_URL}/${DEFAULT_LOCALE}${path}`;
  return languages;
}