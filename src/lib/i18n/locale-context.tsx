"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type Locale,
  type TranslationKey,
  TRANSLATIONS,
  RTL_LOCALES,
} from "./translations";

const STORAGE_KEY = "chessdeeper-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

/**
 * Provides the current locale to the tree below it. Client-only (locale
 * choice lives in localStorage, so the server can't know it ahead of
 * time) — server-rendered markup always starts in English, then swaps
 * to the saved locale on mount. No third-party script, no external
 * requests, no DOM rewriting: this just swaps which string a component
 * renders.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && saved in TRANSLATIONS) setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(l: Locale) {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  const { locale } = useLocale();
  return (key: TranslationKey) => TRANSLATIONS[locale][key] ?? TRANSLATIONS.en[key];
}
