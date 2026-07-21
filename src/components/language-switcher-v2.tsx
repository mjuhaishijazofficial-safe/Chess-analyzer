"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import type { Locale } from "@/i18n/request";

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "ru", label: "Russian" },
  { value: "fr", label: "French" },
  { value: "pt", label: "Portuguese" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "tr", label: "Turkish" },
  { value: "nl", label: "Dutch" },
  { value: "id", label: "Indonesian" },
];

export function LanguageSwitcherV2() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Locale;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <select
      aria-label={t("label")}
      value={locale}
      onChange={onChange}
      disabled={pending}
      className="rounded-lg border border-line bg-panel px-2 py-1.5 font-mono text-xs text-muted outline-none transition hover:border-line-strong disabled:opacity-50"
    >
      {LANGUAGES.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
}