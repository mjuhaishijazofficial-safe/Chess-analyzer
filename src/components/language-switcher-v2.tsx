"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/set-locale";
import type { Locale } from "@/i18n/request";

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
  { value: "ru", label: "RU" },
  { value: "fr", label: "FR" },
];

export function LanguageSwitcherV2() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Locale;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
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
